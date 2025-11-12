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

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  // Create new customer (any authenticated user)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  // Get all customers with filters (authenticated users)
  @Get()
  findAll(@Query() queryDto: QueryCustomersDto) {
    return this.customersService.findAll(queryDto);
  }

  // Get customer statistics (admin only)
  @Get('stats')
  @Roles(UserRole.ADMIN)
  getCustomerStats() {
    return this.customersService.getCustomerStats();
  }

  // Get pending approvals (admin only)
  @Get('pending')
  @Roles(UserRole.ADMIN)
  getPendingApprovals() {
    return this.customersService.getPendingApprovals();
  }

  // Get single customer with balance
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOneWithBalance(id);
  }

  // Update customer
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, updateCustomerDto);
  }

  // Approve/reject customer (admin only)
  @Patch(':id/approve')
  @Roles(UserRole.ADMIN)
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
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
