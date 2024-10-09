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
    ];
    const products2 = [
      'Шоколад чорний Zaini без цукру, 75г',
      'Каша «Овсянушка» з журавлиною, чорницею та чіа, 50г',
      'Каша «Овсянушка» з годжі, гарбузом та чіа, 50г',
    ];
    const result = await openAiApi.getCompletionChat(products1, products2);
    expect(result).toEqual({result: [{id: '', productName: products2[0]}, {id: '854', productName: products2[1]}, {id: '874', productName: products2[2]}]});
  });
});
