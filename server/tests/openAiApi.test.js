const openAiApi = require('../services/openAiApi');

describe('openAi api class', () => {
  it('getCompletionChat', async () => {
    const products1 = [
      { id: '8631', productName: 'Шоколад темний Spell без цукру 70 г' },
      { id: '6874', productName: 'Шоколад молочний Milka, 90 г' },
      {
        id: '854',
        productName:
          'Каша вівсяна з журавлиною, чорницею та чіа Overnight Моментальная Овсянушка м/у 50г',
      },
      {
        id: '874',
        productName:
          'Каша вівсяна з годжі, гарбузом та чіа Overnight Моментальная Овсянушка м/у 50г',
      },
      {
        id: '344',
        productName: 'Напій Sprite 500мл',
      },
    ];
    const products2 = [
      {name: 'Шоколад чорний Zaini без цукру, 75г', i: '11'},
      {name: 'Каша «Овсянушка» з журавлиною, чорницею та чіа, 50г', i: '22'},
      {name: 'Каша «Овсянушка» з годжі, гарбузом та чіа, 50г', i: '33'},
      {name: 'Солодкий газований напій у пляшці', additionalData: 'Brand: Sprite, Weight: 500', i: '12' },
    ];
    const result = await openAiApi.getCompletionChat(products1, products2);
    expect(result).toEqual({
      result: [
        { id: '', productName: products2[0].name, i: products2[0].i },
        { id: '854', productName: products2[1].name, i: products2[1].i },
        { id: '874', productName: products2[2].name, i: products2[2].i },
        {id: '344', productName: products2[3].name, i: products2[3].i}
      ],
    });
  });
});
