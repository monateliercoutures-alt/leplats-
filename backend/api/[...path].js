import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { randomUUID } from 'node:crypto';

let sqlClient;
const db = () => {
  if (!process.env.DATABASE_URL) throw Object.assign(new Error('Database is not configured'), { status: 503 });
  return sqlClient ||= neon(process.env.DATABASE_URL);
};
const send = (res, status, data) => res.status(status).json(data);
const bodyOf = req => typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
const cleanText = (value, max = 240) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const phoneValue = value => String(value || '').replace(/[\s().-]/g, '');
const allowedOrigin = origin => {
  if (!origin) return true;
  const configured = (process.env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean);
  return configured.includes(origin) || /^https:\/\/[a-z0-9.-]+\.vercel\.app$/i.test(origin);
};
function cors(req, res) {
  const origin = req.headers.origin;
  res.setHeader('Vary', 'Origin');
  if (origin && allowedOrigin(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}
function slugify(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'restaurant';
}
function categorySlug(value) {
  const slug=slugify(cleanText(value,100));
  return ({'maquis':'maquis','grillades-rotisserie':'grillades','attieke-aloco':'attieke','cuisine-africaine':'africaine','cuisine-libanaise':'libanaise','fast-food':'fast-food','pizza-italien':'italien','fruits-de-mer':'fruits-de-mer','cuisine-francaise-europeenne':'europeenne','patisserie-snacks-cafe':'patisserie'})[slug]||'maquis';
}
async function authorize(req) {
  const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token || !process.env.JWT_SECRET) throw Object.assign(new Error('Authentification requise.'), { status: 401 });
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
    if (!payload.memberId || !payload.restaurantId) throw new Error('Invalid token');
    return payload;
  } catch (_) {
    throw Object.assign(new Error('Session expirée. Veuillez vous reconnecter.'), { status: 401 });
  }
}
async function authRegister(req, res) {
  const b = bodyOf(req);
  const restaurant = cleanText(b.restaurant_name, 120);
  const commune = cleanText(b.commune, 80);
  const name = cleanText(b.owner_name, 120);
  const phone = phoneValue(b.phone);
  const email = cleanText(b.email, 160).toLowerCase() || null;
  const password = typeof b.password === 'string' ? b.password : '';
  if (!restaurant || !commune || !name || !/^\+?[0-9]{8,15}$/.test(phone) || password.length < 10) {
    return send(res, 400, { error: 'Renseignez le restaurant, la commune, le responsable, un téléphone valide et un mot de passe de 10 caractères minimum.' });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const suffix = randomUUID().slice(0, 8);
  const slug = `${slugify(restaurant)}-${suffix}`;
  try {
    const rows = await db()`
      WITH new_restaurant AS (
        INSERT INTO restaurants (slug,name,category,cuisine,description,phone,email,commune,address,approval_status)
        VALUES (${slug},${restaurant},${categorySlug(b.category)},${cleanText(b.cuisine,100)||'Cuisine ivoirienne'},${cleanText(b.description,1000)},${phone},${email},${commune},${cleanText(b.address,240)},'draft')
        RETURNING id
      )
      INSERT INTO partner_members (restaurant_id,name,phone,email,password_hash,role)
      SELECT id,${name},${phone},${email},${passwordHash},'owner' FROM new_restaurant
      RETURNING id AS member_id, restaurant_id
    `;
    return send(res, 201, { restaurant_id: rows[0].restaurant_id, member_id: rows[0].member_id, status: 'draft', message: 'Brouillon enregistré, en attente de validation.' });
  } catch (error) {
    if (error.code === '23505') return send(res, 409, { error: 'Ce numéro est déjà associé à un compte.' });
    throw error;
  }
}
async function authLogin(req, res) {
  const b = bodyOf(req), phone = phoneValue(b.phone), password = typeof b.password === 'string' ? b.password : '';
  if (!phone || !password) return send(res, 400, { error: 'Téléphone et mot de passe requis.' });
  const rows = await db()`
    SELECT m.id AS member_id,m.restaurant_id,m.name,m.role,m.password_hash,r.name AS restaurant_name,r.approval_status
    FROM partner_members m JOIN restaurants r ON r.id=m.restaurant_id
    WHERE m.phone=${phone} AND m.active=true LIMIT 1
  `;
  if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) return send(res, 401, { error: 'Téléphone ou mot de passe incorrect.' });
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) return send(res, 503, { error: 'La configuration d’authentification est incomplète.' });
  const row = rows[0];
  const token = await new SignJWT({ memberId: row.member_id, restaurantId: row.restaurant_id, role: row.role, name: row.name })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('8h').sign(new TextEncoder().encode(process.env.JWT_SECRET));
  return send(res, 200, { token, member: { id: row.member_id, name: row.name, role: row.role }, restaurant: { id: row.restaurant_id, name: row.restaurant_name, status: row.approval_status } });
}
async function publicRestaurants(req, res, slug) {
  const sql = db();
  let rows;
  if (slug) {
    rows = await sql`SELECT r.id,r.slug,r.name,r.category,r.cuisine,r.description,r.commune,r.address,r.image,r.rating,
      r.eta,r.delivery_fee,r.free_delivery,r.is_open,
      COALESCE(json_agg(json_build_object('id',d.id,'name',d.name,'category',d.category,'description',d.description,'price',d.price,'image',d.image,'available',d.available) ORDER BY d.name) FILTER (WHERE d.id IS NOT NULL),'[]'::json) AS dishes
      FROM restaurants r LEFT JOIN dishes d ON d.restaurant_id=r.id AND d.available=true
      WHERE r.approval_status='approved' AND (r.slug=${slug} OR r.id::text=${slug})
      GROUP BY r.id LIMIT 1`;
    if (!rows.length) return send(res, 404, { error: 'Restaurant introuvable.' });
    return send(res, 200, { restaurant: rows[0] });
  }
  rows = await sql`SELECT r.id,r.slug,r.name,r.category,r.cuisine,r.description,r.commune,r.address,r.image,r.rating,
    r.eta,r.delivery_fee,r.free_delivery,r.is_open,
    COALESCE(json_agg(json_build_object('id',d.id,'name',d.name,'category',d.category,'description',d.description,'price',d.price,'image',d.image,'available',d.available) ORDER BY d.name) FILTER (WHERE d.id IS NOT NULL),'[]'::json) AS dishes
    FROM restaurants r LEFT JOIN dishes d ON d.restaurant_id=r.id AND d.available=true
    WHERE r.approval_status='approved'
    GROUP BY r.id ORDER BY r.name`;
  return send(res, 200, { restaurants: rows });
}
async function bootstrap(req, res, user) {
  const q = db();
  const [restaurants,dishes,orders,promotions,reviews] = await Promise.all([
    q`SELECT * FROM restaurants WHERE id=${user.restaurantId} LIMIT 1`,
    q`SELECT * FROM dishes WHERE restaurant_id=${user.restaurantId} ORDER BY created_at DESC`,
    q`SELECT id,order_number,customer_name,customer_phone,mode,payment_method,payment_status,status,items,total,note,prep_minutes,reject_reason,created_at,updated_at FROM orders WHERE restaurant_id=${user.restaurantId} ORDER BY created_at DESC LIMIT 100`,
    q`SELECT * FROM promotions WHERE restaurant_id=${user.restaurantId} ORDER BY created_at DESC`,
    q`SELECT * FROM reviews WHERE restaurant_id=${user.restaurantId} ORDER BY created_at DESC LIMIT 100`
  ]);
  return send(res, 200, { restaurant: restaurants[0] || null, dishes, orders, promotions, reviews });
}
function validOrderItems(items) {
  return Array.isArray(items) && items.length > 0 && items.length <= 40 && items.every(item => item && /^[0-9a-f-]{36}$/i.test(String(item.dish_id)) && Number.isInteger(Number(item.qty)) && Number(item.qty) > 0 && Number(item.qty) <= 50);
}
async function createOrder(req, res) {
  const b=bodyOf(req), restaurantId=String(b.restaurant_id||'');
  const customerName=cleanText(b.customer_name,120), customerPhone=phoneValue(b.customer_phone), mode=cleanText(b.mode,80)||'Livraison TonMenu Express';
  const method=cleanText(b.payment_method,80), note=cleanText(b.note,1000);
  if (!/^[0-9a-f-]{36}$/i.test(restaurantId) || !customerName || !/^\+?[0-9]{8,15}$/.test(customerPhone) || !method || !validOrderItems(b.items)) return send(res,400,{error:'Informations de commande incomplètes ou invalides.'});
  const sql=db();
  const restaurants=await sql`SELECT id FROM restaurants WHERE id=${restaurantId} AND approval_status='approved' AND is_open=true LIMIT 1`;
  if(!restaurants.length)return send(res,409,{error:'Ce restaurant ne prend pas de commande actuellement.'});
  const ids=[...new Set(b.items.map(i=>String(i.dish_id)))];
  const found=await sql`SELECT id,name,price FROM dishes WHERE restaurant_id=${restaurantId} AND available=true AND id=ANY(${ids}::uuid[])`;
  if(found.length!==ids.length)return send(res,409,{error:'Un ou plusieurs plats ne sont plus disponibles.'});
  const byId=new Map(found.map(d=>[d.id,d]));
  const lines=b.items.map(i=>{const d=byId.get(String(i.dish_id));return {dish_id:d.id,name:d.name,qty:Number(i.qty),unit_price:d.price,line_total:d.price*Number(i.qty)};});
  const total=lines.reduce((sum,line)=>sum+line.line_total,0);
  const rows=await sql`INSERT INTO orders (restaurant_id,customer_name,customer_phone,mode,payment_method,payment_status,status,items,total,note) VALUES (${restaurantId},${customerName},${customerPhone},${mode},${method},'pending_verification','new',${JSON.stringify(lines)}::jsonb,${total},${note}) RETURNING id,order_number,status,payment_status,total,created_at`;
  return send(res,201,{order:rows[0]});
}
async function manageDish(req,res,user,id) {
  const b=bodyOf(req), sql=db();
  if(req.method==='GET'){
    const rows=await sql`SELECT * FROM dishes WHERE restaurant_id=${user.restaurantId} ORDER BY created_at DESC`;
    return send(res,200,{dishes:rows});
  }
  if(req.method==='POST'||req.method==='PUT'||req.method==='PATCH'){
    const name=cleanText(b.name,120),category=cleanText(b.category,100)||'Maquis',description=cleanText(b.description,1000),price=Number(b.price),image=cleanText(b.image,160)||'plats-sauce.webp';
    if(!name||!Number.isInteger(price)||price<0)return send(res,400,{error:'Nom et prix valide requis.'});
    const available=b.available!==false;
    const rows=id?await sql`UPDATE dishes SET name=${name},category=${category},description=${description},price=${price},image=${image},available=${available},updated_at=now() WHERE id=${id} AND restaurant_id=${user.restaurantId} RETURNING *`:await sql`INSERT INTO dishes (restaurant_id,name,category,description,price,image,available) VALUES (${user.restaurantId},${name},${category},${description},${price},${image},${available}) RETURNING *`;
    if(!rows.length)return send(res,404,{error:'Plat introuvable.'});
    return send(res,id?200:201,{dish:rows[0]});
  }
  if(req.method==='DELETE'&&id){const rows=await sql`DELETE FROM dishes WHERE id=${id} AND restaurant_id=${user.restaurantId} RETURNING id`;return rows.length?send(res,200,{deleted:true}):send(res,404,{error:'Plat introuvable.'});}
  return send(res,405,{error:'Méthode non autorisée.'});
}
async function updateOrder(req,res,user,id) {
  if(req.method!=='PATCH')return send(res,405,{error:'Méthode non autorisée.'});
  const b=bodyOf(req), status=b.status===undefined?null:String(b.status), pay=b.payment_status===undefined?null:String(b.payment_status);
  const statuses=['new','preparing','ready','delivery','done','cancelled'];
  const payments=['pending_verification','paid','cash_due','not_received'];
  if(status&&!statuses.includes(status))return send(res,400,{error:'Statut de commande invalide.'});
  if(pay&&!payments.includes(pay))return send(res,400,{error:'Statut de paiement invalide.'});
  const prep=b.prep_minutes===undefined?null:Number(b.prep_minutes);
  const reject=cleanText(b.reject_reason,240)||null;
  const rows=await db()`
    UPDATE orders SET status=COALESCE(${status},status),payment_status=COALESCE(${pay},payment_status),prep_minutes=COALESCE(${prep},prep_minutes),reject_reason=COALESCE(${reject},reject_reason),updated_at=now()
    WHERE id=${id} AND restaurant_id=${user.restaurantId}
    RETURNING id,order_number,status,payment_status,prep_minutes,reject_reason,updated_at
  `;
  return rows.length?send(res,200,{order:rows[0]}):send(res,404,{error:'Commande introuvable.'});
}
async function updateRestaurant(req,res,user) {
  if(req.method==='GET'){
    const rows=await db()`SELECT * FROM restaurants WHERE id=${user.restaurantId} LIMIT 1`;
    return rows.length?send(res,200,{restaurant:rows[0]}):send(res,404,{error:'Restaurant introuvable.'});
  }
  if(req.method!=='PATCH'&&req.method!=='PUT')return send(res,405,{error:'Méthode non autorisée.'});
  const b=bodyOf(req);
  const name=b.name===undefined?null:cleanText(b.name,120),description=b.description===undefined?null:cleanText(b.description,1000),commune=b.commune===undefined?null:cleanText(b.commune,80),address=b.address===undefined?null:cleanText(b.address,240),isOpen=b.is_open===undefined?null:Boolean(b.is_open),eta=b.eta===undefined?null:Math.min(180,Math.max(0,Number(b.eta))),latitude=b.latitude===undefined?null:Number(b.latitude),longitude=b.longitude===undefined?null:Number(b.longitude);
  if(latitude!==null&&!Number.isFinite(latitude)||longitude!==null&&!Number.isFinite(longitude))return send(res,400,{error:'Coordonnées GPS invalides.'});
  const rows=await db()`UPDATE restaurants SET name=COALESCE(${name},name),description=COALESCE(${description},description),commune=COALESCE(${commune},commune),address=COALESCE(${address},address),is_open=COALESCE(${isOpen},is_open),eta=COALESCE(${eta},eta),latitude=COALESCE(${latitude},latitude),longitude=COALESCE(${longitude},longitude),updated_at=now() WHERE id=${user.restaurantId} RETURNING *`;
  return rows.length?send(res,200,{restaurant:rows[0]}):send(res,404,{error:'Restaurant introuvable.'});
}
async function handler(req,res) {
  cors(req,res);
  if(req.method==='OPTIONS')return res.status(204).end();
  const url=new URL(req.url,'https://api.invalid');
  const parts=url.pathname.replace(/^\/api\/?/,'').split('/').filter(Boolean).map(decodeURIComponent);
  const [root, second, third]=parts;
  if(!allowedOrigin(req.headers.origin))return send(res,403,{error:'Origine non autorisée.'});
  if(root==='health'&&req.method==='GET'){
    try{await db()`SELECT 1 AS ok`;return send(res,200,{status:'ok',database:'connected'});}catch(_){return send(res,503,{status:'unavailable',database:'not_configured'});}
  }
  if(root==='restaurants'&&req.method==='GET')return publicRestaurants(req,res,second);
  if(root==='orders'&&req.method==='POST')return createOrder(req,res);
  if(root==='auth'&&second==='register'&&req.method==='POST')return authRegister(req,res);
  if(root==='auth'&&second==='login'&&req.method==='POST')return authLogin(req,res);
  if(root==='partner'){
    const user=await authorize(req);
    if(second==='bootstrap'&&req.method==='GET')return bootstrap(req,res,user);
    if(second==='restaurant')return updateRestaurant(req,res,user);
    if(second==='dishes')return manageDish(req,res,user,third);
    if(second==='orders'&&third)return updateOrder(req,res,user,third);
    if(second==='orders'&&req.method==='GET'){
      const rows=await db()`SELECT * FROM orders WHERE restaurant_id=${user.restaurantId} ORDER BY created_at DESC LIMIT 100`;
      return send(res,200,{orders:rows});
    }
    if(second==='promotions'&&req.method==='GET'){
      const rows=await db()`SELECT * FROM promotions WHERE restaurant_id=${user.restaurantId} ORDER BY created_at DESC`;
      return send(res,200,{promotions:rows});
    }
    if(second==='promotions'&&req.method==='POST'){
      const b=bodyOf(req),code=cleanText(b.code,24).toUpperCase(),name=cleanText(b.name,120);
      if(!code||!name)return send(res,400,{error:'Nom et code de promotion requis.'});
      try{const rows=await db()`INSERT INTO promotions (restaurant_id,code,name,detail,starts_at,ends_at,active) VALUES (${user.restaurantId},${code},${name},${cleanText(b.detail,500)},${b.starts_at||null},${b.ends_at||null},true) RETURNING *`;return send(res,201,{promotion:rows[0]});}
      catch(error){if(error.code==='23505')return send(res,409,{error:'Ce code promotion est déjà utilisé.'});throw error;}
    }
    if(second==='promotions'&&third&&req.method==='PATCH'){
      const active=bodyOf(req).active===true;
      const rows=await db()`UPDATE promotions SET active=${active} WHERE id=${third} AND restaurant_id=${user.restaurantId} RETURNING *`;
      return rows.length?send(res,200,{promotion:rows[0]}):send(res,404,{error:'Promotion introuvable.'});
    }
    if(second==='reviews'&&third&&req.method==='PATCH'){
      const reply=cleanText(bodyOf(req).partner_reply,1000);
      const rows=await db()`UPDATE reviews SET partner_reply=${reply} WHERE id=${third} AND restaurant_id=${user.restaurantId} RETURNING *`;
      return rows.length?send(res,200,{review:rows[0]}):send(res,404,{error:'Avis introuvable.'});
    }
  }
  return send(res,404,{error:'Route API inconnue.'});
}

export default async function api(req,res) {
  try { return await handler(req,res); }
  catch(error) {
    const status=Number(error?.status)||500;
    if(status>=500)console.error('TonMenu API error:',error?.message||error);
    return send(res,status,status===500?{error:'Une erreur serveur est survenue.'}:{error:error.message});
  }
}
