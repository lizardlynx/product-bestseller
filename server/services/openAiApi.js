const OpenAI = require("openai");
const { OPENAI_ASSISTANT_SYSTEM_PROMPT, OPENAI_MODEL } = require("../constants");
const { zodResponseFormat } = require("openai/helpers/zod");
const {z} = require('zod');
require("dotenv").config()
const {encoding_for_model} = require('tiktoken');

const gpt4Enc = encoding_for_model(OPENAI_MODEL);

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
const Product = z.object({
  id: z.string(),
  productName: z.string(),
  i: z.string()
});

const Result = z.object({
  result: z.array(Product),
});

class OpenAIApi {
  async getCompletionChat(productsShop1, productsShop2) {
    const str1 = JSON.stringify(productsShop1);
    const str2 = JSON.stringify(productsShop2);
    let sum = 0;
    let encoded = gpt4Enc.encode(OPENAI_ASSISTANT_SYSTEM_PROMPT);
    sum += encoded.length;
    
    encoded = gpt4Enc.encode(str1);
    sum += encoded.length;

    encoded = gpt4Enc.encode(str2);
    sum += encoded.length;
    gpt4Enc.free();

    console.log("number of tokens:", sum);

    const stream = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        stream: true,
        messages: [
            { role: "system", content: OPENAI_ASSISTANT_SYSTEM_PROMPT },
            {
                role: "user",
                content: str1,
            },
            {
              role: "user",
              content: str2,
          },
        ],
        response_format: zodResponseFormat(Result, "result"),
    });

    let chunks = '';

    for await (const chunk of stream) {
      chunks += chunk.choices[0]?.delta?.content || '';
    }
    return JSON.parse(chunks)
  }
}

module.exports = new OpenAIApi();
