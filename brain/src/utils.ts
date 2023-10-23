import axios from 'axios';
import axiosRetry from 'axios-retry';

import logger from './logging.js';

export const message = async (
  model: string,
  messages: { role: string; content: string }[],
  maxTokens: number,
  temperature?: number
) => {
  const client = axios.create({ baseURL: 'https://api.openai.com/v1' });
  axiosRetry(client, {
    retries: 5,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: error =>
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.response?.status === 429 ||
      error.response?.status === 500 ||
      error.response?.status === 502,
  });
  const data = {
    model,
    messages,
    temperature: temperature || 0,
    max_tokens: maxTokens,
  };
  try {
    const res = await client.post('/chat/completions', data, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    if (res.status !== 200) {
      throw new Error(`OpenAI API error: ${res.statusText}`);
    }

    return res.data.choices[0].message.content.trim();
  } catch (error) {
    // @ts-ignore
    logger.error(JSON.stringify(error.response?.data));
    throw error;
  }
};

export const rawMessage = async (
  model: string,
  messages: { role: string; content: string }[],
  maxTokens: number,
  temperature?: number
) => {
  const client = axios.create({ baseURL: 'https://api.openai.com/v1' });
  axiosRetry(client, {
    retries: 5,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: error =>
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.response?.status === 429 ||
      error.response?.status === 502,
  });

  try {
    const res = await client.post(
      '/chat/completions',
      {
        model,
        messages,
        temperature: temperature || 0,
        max_tokens: maxTokens,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    if (res.status !== 200) {
      throw new Error(`OpenAI API error: ${res.statusText}`);
    }

    return res.data.choices[0].message;
  } catch (error) {
    // @ts-ignore
    logger.error(JSON.stringify(error.response?.data));
    throw error;
  }
};

export const embedding = async (text: string) => {
  const client = axios.create({ baseURL: 'https://api.openai.com/v1' });
  axiosRetry(client, {
    retries: 5,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: error => axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429,
  });

  const embeddingRes = await client.post(
    '/embeddings',
    {
      model: 'text-embedding-ada-002',
      input: [text],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    }
  );

  return embeddingRes.data.data[0].embedding;
};
