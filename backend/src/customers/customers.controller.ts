import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomersDto } from './dto/query-customers.dto';
import { ApproveCustomerDto } from './dto/approve-customer.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { LogActivity } from '../common/decorators/log-activity.decorator'; // ADD THIS
import {
  ActivityAction,
  ActivityEntity,
} from '../database/entities/activity-log.entity'; // ADD THIS

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  // Create new customer (any authenticated user)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @LogActivity({
    action: ActivityAction.CREATE,
    entity: ActivityEntity.CUSTOMER,
    getMessage: (result) =>
      `Created customer: ${result.firstName} ${result.lastName}`,
  })
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  // Get all customers with filters (ANY authenticated user can view)
  @Get()
  findAll(@Query() queryDto: QueryCustomersDto) {
    return this.customersService.findAll(queryDto);
  }

  // Get customer statistics (ANY authenticated user can view)
  @Get('stats')
  getCustomerStats() {
    return this.customersService.getCustomerStats();
  }

  // Get pending approvals (admin only - needs approval permission)
  @Get('pending')
  @Roles(UserRole.ADMIN)
  getPendingApprovals() {
    return this.customersService.getPendingApprovals();
  }

  // Get single customer with balance (any authenticated user)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOneWithBalance(id);
  }

  // Update customer (any authenticated user can update)
  @Patch(':id')
  @LogActivity({
    action: ActivityAction.UPDATE,
    entity: ActivityEntity.CUSTOMER,
    getMessage: (result) =>
      `Updated customer: ${result.firstName} ${result.lastName}`,
  })
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, updateCustomerDto);
  }

  // Approve/reject customer (admin only)
  @Patch(':id/approve')
  @Roles(UserRole.ADMIN)
  @LogActivity({
    action: ActivityAction.APPROVE,
    entity: ActivityEntity.CUSTOMER,
    getMessage: (result) =>
      `${result.status === 'approved' ? 'Approved' : 'Rejected'} customer: ${result.firstName} ${result.lastName}`,
  })
  approveCustomer(
    @Param('id') id: string,
    @Body() approveCustomerDto: ApproveCustomerDto,
  ) {
    return this.customersService.approveCustomer(id, approveCustomerDto.status);
  }

  // Delete customer (admin only)
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @LogActivity({
    action: ActivityAction.DELETE,
    entity: ActivityEntity.CUSTOMER,
    getMessage: (result, params) => `Deleted customer ID: ${params.params.id}`,
  })
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
