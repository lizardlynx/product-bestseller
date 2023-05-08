module.exports = {
  getCategories: `query category($id: Int!, $onServer: Boolean!) {
    category(id: $id) {
      id
      name
      path
      level
      adult
      description
      url_key
      position
      product_count
      children_count
      meta_title @include(if: $onServer)
      meta_keywords @include(if: $onServer)
      meta_description @include(if: $onServer)
      children {
        id
        name
        path
        level
        url_key
        children_count
        image
        position
        children {
          id
          name
          path
          level
          url_key
          children_count
          image
          position
          children {
            id
            name
            path
            level
            url_key
            image
            children_count
            position
            __typename
          }
          __typename
        }
        __typename
      }
      __typename
    }
  }`,
  getProductsByCategory: `query($onServer: Boolean!,$searchQuery: String!, $currentPage: Int!, $pageSize: Int!, $priceSet: Boolean!, $category: [Int], $max_price: Float, $min_price: Float, $sort: sortAttribute, $filter: [filterAttribute]) {
    search: GetSearchResultsRev(search_query: $searchQuery, current_page: $currentPage, page_size: $pageSize, min_price: $min_price, max_price: $max_price, sort: $sort, filterCategories: $category, filterAttributes: $filter) {
      page_info {
        total_pages
        current_page
        page_size
        __typename
      }
      total_count
      total_count_filtered
      min_price @include(if: $priceSet)
      max_price @include(if: $priceSet)
      products {
        id
        sku
        name
        url_key
        type_id
        meta_title @include(if: $onServer)
        meta_keyword @include(if: $onServer)
        meta_description @include(if: $onServer)
        stock_status
        preorder
        thumbnail {
          url
          __typename
        }
        special_price
        price {
          regularPrice {
            amount {
              currency
              value
              __typename
            }
            __typename
          }
          __typename
        }
        attributes {
          code
          label
          value
          __typename
        }
        review_count
        rating_summary
        offers {
          from_date
          to_date
          __typename
        }
        extra_bonus {
          cashback_type
          cashback_value
          __typename
        }
        price_range {
          minimum_price {
            regular_price {
              currency
              value
              __typename
            }
            __typename
          }
          __typename
        }
        categories {
          id
          name
          breadcrumbs {
            id: category_id
            category_id
            category_name
            category_level
            __typename
          }
          __typename
        }
        product_labels {
          alt
          title
          image
          label_type
          visible {
            category {
              position
              display
              __typename
            }
            __typename
          }
          __typename
        }
        tier_price {
          value
          qty
          customer_group_id
          __typename
        }
        ... on ConfigurableProduct {
          configurable_options {
            attribute_code
            product_id
            label
            values {
              default_label
              label
              store_label
              use_default_value
              value_index
              __typename
            }
            __typename
          }
    variants {
    product {
              id
              stock_status
              special_price
    price {
    regularPrice {
    amount {
                    value
                    __typename
                  }
                  __typename
                }
                __typename
              }
              __typename
            }
            __typename
          }
          __typename
        }
        __typename
      }
      __typename
    }
  }`,
};