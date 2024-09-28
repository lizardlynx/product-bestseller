const { firstToUpper, splitCategories } = require("../common");

class ShopsFormatter {
  #shopsIds = {};
  #categoriesAddedTemp = {};
  #categoriesObj = {};
  #shopConfig = {
    auchan: {
      formatCategories: (param) => this.#formatCategoriesAuchan(param),
    },
    silpo: {
      formatCategories: (param) => this.#formatCategoriesSilpo(param),
    },
  };

  constructor() {}

  async #getCategoriesAuchan(currentCategory) {
    const shopId = this.#shopConfig.auchan.dbId;
    const stack = [];
    const categories = [];
    let category = currentCategory;
    let parentId = null;

    category.parentId = parentId;
    stack.push(category);
    categories.push(category);
    while (stack.length != 0) {
      category = stack.pop();
      if (!('visited' in category)) {
        const path = category.path.split('/');
        parentId = path[path.length - 2];
        category.visited = true;
        category.parentId = parentId;
        categories.push(category);
        if (category.children_count == 0) continue;
        for (let child of category.children) {
          stack.push(child);
        }
      }
    }
    categories[0].parentId = null;

    return [categories, shopId, this.#categoriesAddedTemp];
  }

  #formatCategoriesAuchan(data) {
    const currentCategory = data.category;
    return this.#getCategoriesAuchan(currentCategory);
  }

  #formatCategoriesSilpo(data) {
    const currentCategories = data.tree;
    const shopId = this.#shopConfig.silpo.dbId;
    return [currentCategories, shopId, this.#categoriesAddedTemp];
  }

  getShopsConfig() {
    return this.#shopConfig;
  }

  getShopsIds() {
    return this.#shopsIds;
  }

  getCategoriesObj() {
    return this.#categoriesObj;
  }

  processShopsIds(shops) {
    for (let shop of shops) {
      this.#shopConfig[shop.title].dbId = shop.id;
      this.#shopsIds[shop.id] = {
        title: firstToUpper(shop.title),
        product_url: shop.product_url,
      };
    }
  }

  formatCategories(data, shopTitle) {
    const shopFormatFunctions = this.#shopConfig[shopTitle];
    if (shopFormatFunctions) return shopFormatFunctions.formatCategories(data);
    return { success: 0, message: `Shop "${shopTitle}" cannot be processed.` };
  }

  getShops() {
    return this.#shopsIds;
  }

  getCategoriesAddedTemp() {
    return this.#categoriesAddedTemp;
  }

  cacheCategoriesIds(rowsAll) {
    rowsAll.forEach((category) => {
      if (!(category.shop_id in this.#categoriesObj))
        this.#categoriesObj[+category.shop_id] = {};
      if (!(category.shop_category_id in this.#categoriesObj[category.shop_id]))
        this.#categoriesObj[category.shop_id][+category.shop_category_id] = {};
      this.#categoriesObj[category.shop_id][category.shop_category_id] =
        category.db_id;

      const categoryKeyWords = splitCategories(category.title);
      categoryKeyWords.forEach((key) => {
        if (!(key in this.#categoriesAddedTemp))
          this.#categoriesAddedTemp[key] = [];
        this.#categoriesAddedTemp[key].push(category.db_id);
      });
    });
  }


}

const sf = new ShopsFormatter();
module.exports = sf;
