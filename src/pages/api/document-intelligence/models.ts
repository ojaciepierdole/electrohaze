import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
    const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

    if (!endpoint || !key) {
      throw new Error('Missing Azure credentials');
    }

    const response = await fetch(
      `${endpoint}/formrecognizer/documentModels?api-version=2023-07-31`,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': key,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch models from Azure');
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching models:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 