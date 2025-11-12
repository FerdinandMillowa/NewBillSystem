import { IsEnum } from 'class-validator';
import { CustomerStatus } from '../../common/enums';

export class ApproveCustomerDto {
  @IsEnum(CustomerStatus)
  status: CustomerStatus;
}
