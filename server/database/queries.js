module.exports = {
  checkMatchesTable: `select c.id, c.parent_category_id from shop_categories_match a
      inner join categories c
      on a.db_id = c.id
      where a.shop_id = ? and a.shop_category_id = ?`,
  getParentDbId: `select db_id from shop_categories_match
      where shop_id=? and shop_category_id=?`,
  getProductIdExists: `
    select value, shop_id, product_id from features where title = 'id' and value = ?;
  `,
  getShopIs: `
    select max(product_id) i, shop_id from features group by shop_id;
  `,
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
  insertFeatures: `insert ignore into features(product_id, shop_id, title, value)
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
  getShopsByProductId: `select distinct f.product_id, f.shop_id id, s.title from features f
    inner join shops s
    on f.shop_id = s.id
    where f.product_id = ?`,
  selectPricesByDateWrap1: `
    select p.product_id, avg(p.price) price, date(p.date) date, pr.title 
    from prices p
    inner join products pr
    on p.product_id = pr.id
    where p.price <> 99999 and p.comment = 'price' and p.shop_id in 
    `,
  selectPricesByDateWrap2: `and p.product_id in (`,
  selectPricesByDateWrap3: `)
  group by p.product_id, date, pr.title
  order by p.product_id asc, date asc, price desc`,
  selectProductsByMaxNum1: `
    select product_id from (
      select product_id, count(*) num
      from prices 
      where price <> 99999 and comment='price' and shop_id in
  `,
  selectProductsByMaxNum2: `
      group by product_id
      having num in (
        select max_num 
        from (
          select max(num) max_num 
          from (
            select count(num) num_count, num 
            from (
              select product_id, count(*) num
              from prices
              where comment='price' and price<>99999 and shop_id in`,
  selectProductsByMaxNum3: `
              group by product_id
            ) a
            group by num
            order by num_count
          ) b
          where num_count > 30
        ) c
      )
    ) r
`,
  selectDailyDiff1: `
    select date, price, price - LAG(price) OVER (ORDER BY date(date)) AS difference
    from (select distinct date(date) date, sum(price) price from prices where shop_id in
  `,
  selectDailyDiff2: `and comment='price' and product_id in (`,
  selectDailyDiff3: `
  )
  group by date(date)
  ) k`,
  getPricesPerDay: `
    select distinct date, avg(price)
    from prices 
    where comment='price' and shop_id =2

    select distinct date(date), variance(price) price
    from prices
    where comment='price' and shop_id =2
    group by date(date)
    order by date(date) asc;
  `,
  getPricesPerDayOrderBy: ``,
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
  deletePricesByProduct: `delete from prices where product_id = ?`,
  deleteFeaturesByProduct: `delete from features where product_id = ?`,
  deleteProduct: `delete from products where id = ?`,
  getPricesData:
    'select shop_id, DATE_ADD(DATE(date), INTERVAL 3 HOUR) date, price, comment from prices where product_id = ?',
  getPricesById: 'select * from prices where product_id = ?',
  getFeaturesById: 'select * from features where product_id = ?',
  getPricesDataByDates:
    'select shop_id, DATE_ADD(DATE(date), INTERVAL 3 HOUR) date, price, comment from prices where product_id = ? and (date between ? and ?)',
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
  where f.shop_id <> ? and (p.weight_g = ? or p.weight_g is null) and p.id in
  (select id from (select count(f.shop_id) count, p.id id from products p
  inner join features f
  on p.id = f.product_id
  where f.title = 'id'
  group by p.id
  having count = 1) a)`, // p.brand = ?
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
  //???
  getShopPricesByDate: `select DATE_ADD(DATE(b.date), INTERVAL 3 HOUR) as sumdate, sum(b.price) as sum, b.shop_id 
  from (
    select p.id as product_id, p.title, count(distinct f.shop_id) res 
    from products p
    inner join features f
    on p.id=f.product_id
    group by p.id, p.title
    having res=2
  ) a
  inner join prices b
  on a.product_id = b.product_id
  where b.comment='price' and b.price<>99999
  group by sumdate, shop_id
  order by sumdate asc, shop_id desc`,
  disconnectProducts: `

  `,
  updateProduct: `
    update products set description = ?, weight_g = ? where id = ?;
  `,
  insertPriceData: `insert into prices(shop_id, date, price, comment, product_id) values `,
  insertFeatureData: `insert into features(shop_id, title, value, product_id) values `,
  selectAvgDiffByShopDate: `select AVG(diff) diff, DATE_ADD(d, INTERVAL 3 HOUR) date from (
    select (p1.price - p2.price) diff, p1.d, p1.product_id
    from (
      select p.product_id, p.price, p.shop_id, DATE(p.date) d from prices p
      inner join (select b.product_id from (select p.id as product_id, p.title, count(distinct f.shop_id) res 
        from products p
        inner join features f
        on p.id=f.product_id
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
        group by p.id, p.title
        having res=2) b) a
      on p.product_id=a.product_id
      where p.comment='price' and p.shop_id=1 and p.price<>99999) p2
    on p1.product_id=p2.product_id
    where p1.d = p2.d
    ) a
    group by date`,
  checkExistingApiTables: `
      create table if not exists api(
        id int auto_increment,
        name varchar(100),
        shortened varchar(30),
        primary key(id),
        unique(name)
      );

      create table if not exists api_value(
        id int auto_increment,
        api_id int,
        date datetime,
        value varchar(100),
        primary key(id),
        foreign key(api_id) references api(id)
      );
  `,
  getValuesByApiName: `
        select * 
        from api a
        inner join api_value av
        on a.id = av.api_id
        where a.name = ?
  `,
  getStartDate: `
        select date(min(date)) date from  prices;
  `,
  getBankDates: `
  select date(date) date
   from api_value av
   inner join api a
   on a.id = av.api_id
    where a.shortened = ?;
  `,
  getEndDate: `
  select date(max(date)) date from  prices;
`,
  getApiIdByApiName: `
    select * from api where name = ?`,
  createApi: `
    insert into api(name, shortened) values(?, ?);
  `,
  insertApiValues: `
  insert into api_value(api_id, date, value) values 
  `,
  getByApi: `
        select * from api a
        inner join api_value av
        on a.id = av.api_id
        where a.name = ?
  `,
  recreateDbQuery: `
      drop table if exists lists;
      drop table if exists shop_categories_match;
      drop table if exists features;
      drop table if exists prices;
      drop table if exists products;
      drop table if exists categories;
      drop table if exists shops;
      drop table if exists api;
      drop table if exists api_value;

      create table if not exists api(
        id int auto_increment,
        name varchar(100),
        shortened varchar(30),
        primary key(id),
        unique(name)
      );

      create table if not exists api_value(
        id int auto_increment,
        api_id int,
        date datetime,
        value varchar(100),
        primary key(id),
        foreign key(api_id) references api(id)
      );
      
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
