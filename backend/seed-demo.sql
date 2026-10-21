-- Optional fictional seed for Preview testing only. Never use this as production data.
INSERT INTO restaurants (id,slug,name,category,cuisine,description,phone,email,commune,address,image,rating,eta,delivery_fee,free_delivery,is_open,approval_status)
VALUES ('3f8fdc1a-778d-46f0-93f0-74ac37710001','chez-aya-niangon-demo','Chez Aya — Niangon','maquis','Maquis ivoirien','Cuisine familiale et spécialités du quartier.','+2250701020304','demo@tonmenu.ci','Yopougon','Niangon Sud, Abidjan','plats-sauce.webp',4.8,20,800,false,true,'approved')
ON CONFLICT (id) DO NOTHING;

INSERT INTO dishes (id,restaurant_id,name,category,description,price,image,available,popular) VALUES
('3f8fdc1a-778d-46f0-93f0-74ac37711001','3f8fdc1a-778d-46f0-93f0-74ac37710001','Kédjénou de poulet','Maquis','Poulet mijoté aux légumes et épices du pays.',7000,'plats-sauce.webp',true,true),
('3f8fdc1a-778d-46f0-93f0-74ac37711002','3f8fdc1a-778d-46f0-93f0-74ac37710001','Poulet braisé demi','Grillades / Rôtisserie','Mariné maison, braisé au feu de bois.',6500,'grillades.webp',true,true),
('3f8fdc1a-778d-46f0-93f0-74ac37711003','3f8fdc1a-778d-46f0-93f0-74ac37710001','Attiéké poisson','Attiéké & Aloco','Poisson frais, attiéké, oignons et tomate.',6000,'attieke-poisson.webp',true,false),
('3f8fdc1a-778d-46f0-93f0-74ac37711004','3f8fdc1a-778d-46f0-93f0-74ac37710001','Jollof rice au poulet','Cuisine africaine','Riz parfumé, poulet grillé et banane plantain.',7500,'cuisine-africaine.webp',true,false)
ON CONFLICT (id) DO NOTHING;
