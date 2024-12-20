import type { ModelConfig } from '@/types/models';

const modelConfig: ModelConfig = {
  groups: [
    {
      name: 'Faktury',
      models: [
        {
          id: 'prebuilt-invoice',
          name: 'Faktury (prebuilt)',
          description: 'Model predefiniowany do analizy faktur',
          version: '3.0',
          type: 'prebuilt',
          capabilities: ['invoice-analysis'],
          fields: ['InvoiceId', 'InvoiceDate', 'DueDate', 'Total'],
          status: 'active'
        },
        {
          id: 'custom-invoice-pl',
          name: 'Faktury PL (custom)',
          description: 'Model dostosowany do polskich faktur',
          version: '1.0',
          type: 'custom',
          capabilities: ['invoice-analysis-pl'],
          fields: ['NIP', 'REGON', 'KRS'],
          status: 'active'
        }
      ]
    }
  ],
  defaultModel: 'prebuilt-invoice'
};

export default modelConfig; 