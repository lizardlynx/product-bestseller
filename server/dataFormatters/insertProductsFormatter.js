const { datetime, resolveFeatureName, resolveFeatureValue, resolveCountry, resolveWeight, resolveBrand, cleanArray } = require('../common.js');
const shopsFormatter = require('../dataFormatters/shopsFormatter.js');

class InsertProductsFormatter {
  #categoriesToInsert = {};
  #insertShop = null;
  #productIds = [];
  #insertFeatureData = [];
  #insertPriceData = [];
  #insertProductData = [];
  #idProductMatch = {};

  getCategoriesAdditionalData() {
    return [
      this.#categoriesToInsert,
      shopsFormatter.getCategoriesObj(),
      this.#insertShop,
      shopsFormatter.getCategoriesAddedTemp(),
      this.#productIds,
    ];
  }

  // not needed
  // cleanInsertProductData() {
  //   this.#insertFeatureData = [];
  //   this.#insertProductData = [];
  //   this.#insertPriceData = [];
  //   this.#productIds = [];
  //   this.#idProductMatch = {};
  //   this.#insertShop = null;
  //   this.#categoriesToInsert = {};
  // }

  addAuchanProductsToQuery(products, dbId) {
    const shopId = shopsFormatter.getShopsConfig().auchan.dbId;
    this.#insertShop = shopId;
    for (let product of products.search.products) {
      if (this.#productIds.includes(product.id)) {
        continue;
      }
      let country = null;
      let brand = null;
      let weight = null;
      const priceData = [];
      const currPrice = product.special_price;
      const oldPrice = product.price.regularPrice.amount.value;
      if (!currPrice)
        priceData.push(null, shopId, datetime(), oldPrice, 'price');
      else {
        priceData.push(null, shopId, datetime(), currPrice, 'price');
        priceData.push(null, shopId, datetime(), oldPrice, 'oldPrice');
      }

      this.#insertPriceData.push(priceData);

      const featureData = [];
      featureData.push(
        null,
        shopId,
        'url_key',
        product.url_key,
        null,
        shopId,
        'id',
        product.id
      );
      this.#productIds.push(product.id);
      this.#idProductMatch[product.id] = this.#productIds.length - 1;
      for (let attribute of product.attributes) {
        if (attribute.code == 'country_of_manufacture')
          country = attribute.value;
        else if (attribute.code == 'brand') brand = attribute.value;
        else if (attribute.code == 'weight2') weight = attribute.value;
        else featureData.push(null, shopId, attribute.label, attribute.value);
      }
      this.#insertFeatureData.push(featureData);
      if (!weight) {
        const nameParts = product.name.split(',');
        weight = nameParts[nameParts.length - 1];
      }

      const category = product.categories[product.categories.length - 1];
      const categoryId = category.id;
      const categoryName = category.name;
      const dbCategoryId = shopsFormatter.getCategoriesObj()[shopId][categoryId];
      if (!dbCategoryId) {
        this.#categoriesToInsert[this.#insertProductData.length] = {
          id: categoryId,
          name: categoryName,
          parentId: dbId,
        };
      }

      this.#insertProductData.push([
        dbCategoryId,
        product.name,
        product.meta_description,
        product.thumbnail.url,
        resolveCountry(country),
        resolveWeight(weight),
        resolveBrand(brand),
      ]);
    }
  }

  addSilpoProductsToQuery(products, dbId) {
    const shopId = shopsFormatter.getShopsConfig().silpo.dbId;
    this.#insertShop = shopId;
    for (let product of products.data.items) {
      if (this.#productIds.includes(product.id)) {
        continue;
      }
      let country = null;
      let brand = null;
      let weight = product.unit;
      const priceData = [];
      for (let price of product.prices) {
        let comment = price.Type;
        if (comment == 'specialPrice')
          comment = product.promotions[0].description;
        priceData.push(null, shopId, datetime(), price.Value, comment);
      }
      this.#insertPriceData.push(priceData);

      const featureData = [];
      featureData.push(
        null,
        shopId,
        'url_key',
        product.slug,
        null,
        shopId,
        'id',
        product.id
      );
      this.#productIds.push(product.id);
      this.#idProductMatch[product.id] = this.#productIds.length - 1;
      if (product.parameters) {
        for (let attribute of product.parameters) {
          if (attribute.key == 'country') country = attribute.value;
          else if (attribute.key == 'trademark') brand = attribute.value;
          else if (attribute.name)
            featureData.push(
              null,
              shopId,
              resolveFeatureName(attribute.name),
              resolveFeatureValue(attribute.value)
            );
        }
      }

      const category = product.categories[product.categories.length - 1];
      const categoryId = category.id;
      const categoryName = category.name;
      let dbCategoryId = shopsFormatter.getCategoriesObj()[shopId][categoryId];

      if (categoryName && !dbCategoryId) {
        this.#categoriesToInsert[this.#insertProductData.length] = {
          id: categoryId,
          name: categoryName,
          parentId: dbId,
        };
      } else if (!categoryName) dbCategoryId = dbId;

      this.#insertFeatureData.push(featureData);
      this.#insertProductData.push([
        dbCategoryId,
        product.name,
        null,
        product.mainImage,
        resolveCountry(country),
        resolveWeight(weight),
        resolveBrand(brand),
      ]);
    }
  }

  pickUpdates(ids) {
    const featureInsertLen = 4;
    const priceInsertLen = 5;
    const pricesUpdate = [];
    const featuresUpdate = [];
    for (const id of ids) {
      const shopId = id.id;
      const dbId = id.product_id;
      const i = this.#idProductMatch[shopId].toString();
      this.#insertProductData[i] = null;
      // if (!this.#insertFeatureData[i]) continue; // fix it
      const featureUpdate = this.#insertFeatureData[i].slice();
      this.#insertFeatureData[i] = null;
      const priceUpdate = this.#insertPriceData[i].slice();
      this.#insertPriceData[i] = null;
      if (id.update_needed) {
        for (let j = 0; j < priceUpdate.length; j += priceInsertLen) {
          const chunk = priceUpdate.slice(j, j + priceInsertLen);
          chunk[0] = dbId;
          pricesUpdate.push(chunk);
        }
      }

      for (let j = 0; j < featureUpdate.length; j += featureInsertLen) {
        const chunkF = featureUpdate.slice(j, j + featureInsertLen);
        chunkF[0] = dbId;
        featuresUpdate.push(chunkF);
      }
    }

    cleanArray(this.#insertProductData);
    cleanArray(this.#insertFeatureData);
    cleanArray(this.#insertPriceData);
    return { prices: pricesUpdate, features: featuresUpdate };
  }

  getInsertProductsData() {
    const insertProductData = this.#insertProductData;
    const insertFeatureData = this.#insertFeatureData;
    const insertPriceData = this.#insertPriceData;
    return {
      insertProductData,
      insertFeatureData,
      insertPriceData,
    };
  }
}

module.exports = InsertProductsFormatter;