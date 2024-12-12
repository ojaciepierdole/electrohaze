import type { GroupConfidence } from '@/utils/text-formatting';
import type { 
  PPEData, 
  CorrespondenceData, 
  CustomerData, 
  SupplierData, 
  BillingData 
} from './fields';

export interface BaseDataGroupProps {
  confidence: GroupConfidence;
  showSummary?: boolean;
}

export interface PPEDataGroupProps extends BaseDataGroupProps {
  data: Partial<PPEData>;
}

export interface CorrespondenceDataGroupProps extends BaseDataGroupProps {
  data: Partial<CorrespondenceData>;
}

export interface CustomerDataGroupProps extends BaseDataGroupProps {
  data: Partial<CustomerData>;
}

export interface SupplierDataGroupProps extends BaseDataGroupProps {
  data: Partial<SupplierData>;
}

export interface BillingDataGroupProps extends BaseDataGroupProps {
  data: Partial<BillingData>;
} 