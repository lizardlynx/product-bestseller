const OpenAI = require("openai");
const { OPENAI_ASSISTANT_SYSTEM_PROMPT } = require("../constants");
const { zodResponseFormat } = require("openai/helpers/zod");
const {z} = require('zod');

const openai = new OpenAI();
const Product = z.object({
  id: z.string(),
  productName: z.string(),
});

const Result = z.object({
  result: z.array(Product),
});

const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
        { role: "system", content: OPENAI_ASSISTANT_SYSTEM_PROMPT },
        {
            role: "user",
            content: "Write a haiku about recursion in programming.",
        },
    ],
    response_format: zodResponseFormat(Result, "result"),
});

console.log(completion.choices[0].message);