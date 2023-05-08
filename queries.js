module.exports = {
  checkMatchesTable: `select c.id, c.parent_category_id from shop_categories_match a
      inner join categories c
      on a.db_id = c.id
      where a.shop_id = ? and a.shop_category_id = ?`,
  getParentDbId: `select db_id from shop_categories_match
      where shop_id=? and shop_category_id=?`,
  insertCategory: 'insert into categories(title, parent_category_id) values (?, ?)',
  insertCategoryMatch: 'insert into shop_categories_match(shop_id, db_id, shop_category_id) values (?, ?, ?)',
  getShops: 'select * from shops',
  categoryExists: 'select id from categories where title = ?',
  getCategories: `select a.title, a.id, a.parent_category_id, b.title as parent_title from categories a
      left join categories b
      on b.id = a.parent_category_id
      order by a.title asc`,
  getCategoryIds: `select shop_category_id, shop_id from shop_categories_match
      where db_id=?`,
  getCategoriesIds: `select shop_category_id, shop_id, db_id from shop_categories_match
      where db_id not in (select parent_category_id as db_id from categories where parent_category_id is not null)`,
  insertProduct: `insert into products(category_id, title, description, image, country, weight_g, brand)
      values `,
  insertPrice: `insert into prices(product_id, shop_id, date, price, comment)
      values `,
  insertFeatures: `insert into features(product_id, shop_id, title, value)
      values `,
  getProductsByCategory: `select p1.id, p1.category_id, p1.title, p1.image, p1.description, p1.country, p1.weight_g, p1.brand, f.shop_id, f.title as 'feature', f.value from products p1
        left join features f
        on p1.id = f.product_id
        where p1.category_id = ?`,
  getPricesOfProducts: `select p1.product_id, p1.shop_id, p1.comment, max(p1.date) as date, p1.price from prices p1
    left join products p2
    on p1.product_id = p2.id
    where p2.category_id = ?
    group by p1.product_id, p1.shop_id, p1.comment, p1.price`,
  getProduct: 'select * from products where id=?',
  getPricesByProduct: `select shop_id, comment, max(date) as date, price from prices
    where product_id = ?
    group by shop_id, comment, price`,
  getFeaturesByProduct: 'select shop_id, title, value from features where product_id = ?',
  getPricesData: 'select shop_id, date, price, comment from prices where product_id = ?',
  getBrands: 'select * from brands',
  getCountry: 'select * from countries where title in ',
  checkExistingIds: 'select value id, product_id from features where shop_id=? and title=\'id\' and value in ',
  selectSimilarProducts: `select distinct p.* from products p
  inner join features f
  on p.id = f.product_id
  where p.brand = ? and p.weight_g = ? and f.shop_id <> ?`,
  recreateDbQuery: `
      drop table if exists shop_categories_match;
      drop table if exists features;
      drop table if exists prices;
      drop table if exists products;
      drop table if exists categories;
      drop table if exists shops;
      
      create table categories(
        id int auto_increment,
          title varchar(100),
          parent_category_id int,
          primary key(id),
          foreign key(parent_category_id) references categories(id)
      );
      
      create table shops(
        id int auto_increment,
          title varchar(70),
          product_url varchar(150),
        primary key(id),
          unique(title)
      );
      
      create table products(
        id int auto_increment, 
          category_id int,
          title varchar(300),
          description varchar(400),
          image varchar(300),
          country varchar(50),
          weight_g int,
          brand varchar(100),
          primary key(id),
          foreign key(category_id) references categories(id)
      );
      
      create table prices(
        id int auto_increment,
          product_id int,
          shop_id int,
          date datetime,
          price decimal(10, 2),
          comment varchar(300),
          primary key(id),
          foreign key(product_id) references products(id),
          foreign key(shop_id) references shops(id)
      );
      
      
      create table features(
        id int auto_increment,
          product_id int,
          shop_id int,
          title varchar(100),
          value varchar(700),
          primary key(id),
          foreign key(product_id) references products(id),
          foreign key(shop_id) references shops(id),
          unique(shop_id, product_id, title)
      );
      
      create table shop_categories_match(
        id int auto_increment,
          shop_id int,
          db_id int,
          shop_category_id int,
          primary key(id),
          foreign key(db_id) references categories(id),
          foreign key(shop_id) references shops(id)
      );
      
      insert into shops(title, product_url) values('auchan', 'https://auchan.ua/ua/'),('silpo','https://shop.silpo.ua/product/');
      insert into categories(title, parent_category_id) values('Продукти харчування', null);
    `,
};
