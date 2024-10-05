module.exports = {
  checkMatchesTable: `select c.id, c.parent_category_id from shop_categories_match a
      inner join categories c
      on a.db_id = c.id
      where a.shop_id = ? and a.shop_category_id = ?`,
  getParentDbId: `select db_id from shop_categories_match
      where shop_id=? and shop_category_id=?`,
  insertCategory:
    'insert into categories(title, parent_category_id) values (?, ?)',
  insertCategoryMatch:
    'insert into shop_categories_match(shop_id, db_id, shop_category_id) values (?, ?, ?)',
  getShops: 'select * from shops',
  categoryExists: 'select id from categories where title = ?',
  getCategories: `select a.title, a.id, a.parent_category_id, b.title as parent_title from categories a
      left join categories b
      on b.id = a.parent_category_id
      order by a.title asc`,
  getCategoriesIds: `select m.shop_category_id, m.shop_id, m.db_id from categories c
  inner join shop_categories_match m
  on c.id=m.db_id
  where c.parent_category_id=1`,
  getAllCategoriesIds:
    'select a.shop_category_id, a.shop_id, a.db_id, b.title from shop_categories_match a inner join categories b on a.db_id=b.id',
  insertProduct: `insert into products(category_id, title, description, image, country, weight_g, brand)
      values `,
  insertPrice: `insert into prices(product_id, shop_id, date, price, comment)
      values `,
  insertFeatures: `insert into features(product_id, shop_id, title, value)
      values `,
  getProductsByCategory: `select p.id, p.category_id, p.title, p.description, p.image, p.country, p.weight_g, p.brand, count(f.shop_id) count from products p 
  left join features f
  on p.id = f.product_id
  where p.category_id in `,
  getProductsByCategoryGroupBy: `and f.title = 'id'
  group by p.id, p.category_id, p.title, p.description, p.image, p.country, p.weight_g, p.brand
  order by count desc, p.title asc `,
  getProductsByName: `select p.id, p.title, count(f.shop_id) count from products p 
  left join features f
  on p.id = f.product_id
  where p.title like ? and f.title = 'id'
  group by p.id, p.title
  order by CHAR_LENGTH(p.title) asc, count desc, p.title asc limit 10 offset 0`,
  getShopIdsByProduct: `select distinct product_id, shop_id from features
    where product_id in `,
  countProductsByCategory: `select count(*) count from products where category_id in `,
  getCategoryHierarchy: `with recursive cte as (
    select id, parent_category_id, title
    from categories where id=?
    union all
    select c.id, c.parent_category_id, c.title from categories c
      inner join cte p
    on p.parent_category_id = c.id
  )
  select * from cte order by id asc`,
  getFeaturesByProducts: `select product_id, shop_id, shop_id, title as 'feature', value from features
  where product_id in `,
  getChildCategories: `with recursive cte as (
    select id, parent_category_id, title
    from categories where id=?
    union all
    select c.id, c.parent_category_id, c.title from categories c
      inner join cte p
    on p.id = c.parent_category_id
  )
  select * from cte`,
  getPricesOfProducts: `select b.product_id, MIN(b.price) price from prices b
    inner join (
      select p1.product_id, p1.shop_id, p1.comment, max(DATE(p1.date)) as date from prices p1
      where p1.comment = 'price' and p1.product_id in`,
  getPricesOfProductsGroupBy: `group by p1.product_id, p1.shop_id, p1.comment) a
    on b.product_id = a.product_id
    where b.shop_id=a.shop_id and b.comment=a.comment and DATE(b.date)=a.date
    group by b.product_id`,
  getProduct: 'select * from products where id=?',
  getPricesByProduct: `select a.comment, a.shop_id, a.date, b.price from 
    (select distinct comment, product_id, shop_id, max(date) as date
    from prices
    where product_id=?
    group by comment, shop_id, product_id) a 
    inner join prices b
    on a.date=b.date
    where a.shop_id=b.shop_id and a.comment=b.comment and b.product_id=a.product_id`,
  getFeaturesByProduct:
    'select shop_id, title, value from features where product_id = ?',
  getPricesData:
    'select shop_id, DATE_ADD(DATE(date), INTERVAL 3 HOUR) date, price, comment from prices where product_id = ?',
  getPricesDataByDates: 'select shop_id, DATE_ADD(DATE(date), INTERVAL 3 HOUR) date, price, comment from prices where product_id = ? and (date between ? and ?)',
  getBrands: 'select * from brands',
  getCountry: 'select * from countries where title in ',
  checkExistingProductIds: `select f.value id, f.product_id, DATE(max(r.date)) <> CURDATE() update_needed from features f
  inner join prices r
  on f.product_id = r.product_id
   where f.shop_id=?  and r.shop_id=f.shop_id and f.title='id' and f.value in `,
  checkExistingProductIdsGroupBy: ' group by f.value, f.product_id',
  selectSimilarProducts: `select distinct p.* from products p
  inner join features f
  on p.id = f.product_id
  where ? not in (select distinct f.shop_id from products p
    inner join features f
    on p.id = f.product_id)`, // p.brand = ? 
  getAllLists: `select distinct list_id, title from lists`,
  getListById: `select p.id, p.title, l.title as list, r.price, r.shop_id, MAX(r.date) as date from lists l
    left join products p
    on l.product_id = p.id
    left join prices r
    on l.product_id = r.product_id
    where r.comment='price' and l.list_id=?
    group by  p.id, p.title, r.price, r.shop_id, l.title`,
  getListPrices: `select sum(price) as price, DATE_ADD(DATE(date), INTERVAL 3 HOUR) as d, shop_id
    from prices
    where comment='price' and product_id in `,
  getListPricesGroupBy: ` group by d, shop_id order by d `,
  getListPricesByShop: `select p.price, DATE_ADD(DATE(p.date), INTERVAL 3 HOUR) as date, p.shop_id, p.product_id, a.title
    from prices p
    inner join products a
    on p.product_id = a.id
    where p.comment='price' and p.product_id in `,
  selectFreeListId: `select MAX(list_id) + 1 as id from lists`,
  insertNewList: `insert into lists(list_id, product_id, title) values `,
  getShopPricesByDate: `select DATE_ADD(DATE(b.date), INTERVAL 3 HOUR) as sumdate, sum(b.price) as sum, b.shop_id from (
      select count(DATE(date))/(1 + DATEDIFF(max(DATE(date)),min(DATE(date)))) expr, product_id as id from prices 
      where comment='price' and 
      product_id in (select b.product_id from (select p.id as product_id, p.title, count(distinct f.shop_id) res 
        from products p
        inner join features f
        on p.id=f.product_id
        where f.title = 'instock' and f.value='1'
        group by p.id, p.title
        having res=2) b) 
      group by product_id
      having expr = 2) a
    inner join prices b
    on a.id = b.product_id
    where b.comment='price' and b.price<>99999
    group by sumdate, shop_id
    order by sumdate asc, shop_id desc`,
  selectAvgDiffByShopDate: `select AVG(diff) diff, DATE_ADD(d, INTERVAL 3 HOUR) date from (
    select (p1.price - p2.price) diff, p1.d, p1.product_id
    from (
      select p.product_id, p.price, p.shop_id, DATE(p.date) d from prices p
      inner join (select b.product_id from (select p.id as product_id, p.title, count(distinct f.shop_id) res 
        from products p
        inner join features f
        on p.id=f.product_id
        where f.title = 'instock' and f.value='1'
        group by p.id, p.title
        having res=2) b) a
      on p.product_id=a.product_id
      where p.comment='price' and p.shop_id=2) p1
    inner join (
      select p.product_id, p.price, p.shop_id, DATE(p.date) d from prices p
      inner join (select b.product_id from (select p.id as product_id, p.title, count(distinct f.shop_id) res 
        from products p
        inner join features f
        on p.id=f.product_id
        where f.title = 'instock' and f.value='1'
        group by p.id, p.title
        having res=2) b) a
      on p.product_id=a.product_id
      where p.comment='price' and p.shop_id=1 and p.price<>99999) p2
    on p1.product_id=p2.product_id
    where p1.d = p2.d
    ) a
    group by date`,
  recreateDbQuery: `
      drop table if exists lists;
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

      create table lists(
        list_id int ,
          product_id int,
          title varchar(500)
      );
      
      insert into shops(title, product_url) values('auchan', 'https://auchan.ua/ua/'),('silpo','https://shop.silpo.ua/product/');
      insert into categories(title, parent_category_id) values('Продукти харчування', null);
    `,
};
