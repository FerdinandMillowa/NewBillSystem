import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateDailySalesModule1701000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. CREATE PRODUCT_CATEGORIES TABLE
    await queryRunner.createTable(
      new Table({
        name: 'product_categories',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'display_order',
            type: 'int',
            default: 0,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // 2. CREATE PRODUCTS TABLE
    await queryRunner.createTable(
      new Table({
        name: 'products',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'category_id',
            type: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'unit',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'size',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'current_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'current_stock',
            type: 'int',
            default: 0,
          },
          {
            name: 'shots_per_bottle',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'linked_shot_product_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Foreign key: products -> product_categories
    await queryRunner.createForeignKey(
      'products',
      new TableForeignKey({
        columnNames: ['category_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'product_categories',
        onDelete: 'CASCADE',
      }),
    );

    // Index on category_id for faster queries
    await queryRunner.createIndex(
      'products',
      new TableIndex({
        name: 'IDX_PRODUCT_CATEGORY',
        columnNames: ['category_id'],
      }),
    );

    // 3. CREATE PRICE_HISTORY TABLE
    await queryRunner.createTable(
      new Table({
        name: 'price_history',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'product_id',
            type: 'uuid',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'old_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'new_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'effective_date',
            type: 'date',
          },
          {
            name: 'reason',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Foreign keys for price_history
    await queryRunner.createForeignKey(
      'price_history',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'price_history',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // 4. CREATE DAILY_SALES TABLE
    await queryRunner.createTable(
      new Table({
        name: 'daily_sales',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'date',
            type: 'date',
            isUnique: true,
          },
          // Revenue collection
          {
            name: 'cash',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'airtel_money',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'mpamba',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'bank',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'total_collected',
            type: 'decimal',
            precision: 12,
            scale: 2,
          },
          // Sales calculations
          {
            name: 'total_sales',
            type: 'decimal',
            precision: 12,
            scale: 2,
          },
          {
            name: 'bills_amount',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'shortage',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          // Expenses
          {
            name: 'total_expenses',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          {
            name: 'cash_expenses',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          // Net calculations
          {
            name: 'net_revenue',
            type: 'decimal',
            precision: 12,
            scale: 2,
          },
          {
            name: 'cash_at_hand',
            type: 'decimal',
            precision: 12,
            scale: 2,
          },
          // Stock purchases
          {
            name: 'total_stock_purchases',
            type: 'decimal',
            precision: 12,
            scale: 2,
            default: 0,
          },
          // Status
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'finalized'],
            default: "'draft'",
          },
          {
            name: 'finalized_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Index on date for faster queries
    await queryRunner.createIndex(
      'daily_sales',
      new TableIndex({
        name: 'IDX_DAILY_SALES_DATE',
        columnNames: ['date'],
      }),
    );

    // 5. CREATE DAILY_INVENTORY TABLE
    await queryRunner.createTable(
      new Table({
        name: 'daily_inventory',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'daily_sales_id',
            type: 'uuid',
          },
          {
            name: 'product_id',
            type: 'uuid',
          },
          {
            name: 'opening_stock',
            type: 'int',
          },
          {
            name: 'stock_in',
            type: 'int',
            default: 0,
          },
          {
            name: 'closing_stock',
            type: 'int',
          },
          {
            name: 'sold_quantity',
            type: 'int',
          },
          {
            name: 'product_price',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'revenue',
            type: 'decimal',
            precision: 12,
            scale: 2,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Foreign keys for daily_inventory
    await queryRunner.createForeignKey(
      'daily_inventory',
      new TableForeignKey({
        columnNames: ['daily_sales_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'daily_sales',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'daily_inventory',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'CASCADE',
      }),
    );

    // Unique constraint: one product per daily sales record
    await queryRunner.createIndex(
      'daily_inventory',
      new TableIndex({
        name: 'IDX_DAILY_INVENTORY_UNIQUE',
        columnNames: ['daily_sales_id', 'product_id'],
        isUnique: true,
      }),
    );

    // 6. CREATE DAILY_EXPENSES TABLE
    await queryRunner.createTable(
      new Table({
        name: 'daily_expenses',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'daily_sales_id',
            type: 'uuid',
          },
          {
            name: 'category',
            type: 'enum',
            enum: [
              'utilities',
              'supplies',
              'wages',
              'transport',
              'maintenance',
              'other',
            ],
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'payment_method',
            type: 'enum',
            enum: ['cash', 'airtel_money', 'mpamba', 'bank', 'card'],
            default: "'cash'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Foreign key for daily_expenses
    await queryRunner.createForeignKey(
      'daily_expenses',
      new TableForeignKey({
        columnNames: ['daily_sales_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'daily_sales',
        onDelete: 'CASCADE',
      }),
    );

    // 7. CREATE STOCK_PURCHASES TABLE
    await queryRunner.createTable(
      new Table({
        name: 'stock_purchases',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'daily_sales_id',
            type: 'uuid',
          },
          {
            name: 'product_id',
            type: 'uuid',
          },
          {
            name: 'quantity',
            type: 'int',
          },
          {
            name: 'unit_cost',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'total_cost',
            type: 'decimal',
            precision: 12,
            scale: 2,
          },
          {
            name: 'payment_method',
            type: 'enum',
            enum: [
              'cash',
              'airtel_money',
              'mpamba',
              'bank',
              'card',
              'mobile_money',
            ],
          },
          {
            name: 'supplier',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Foreign keys for stock_purchases
    await queryRunner.createForeignKey(
      'stock_purchases',
      new TableForeignKey({
        columnNames: ['daily_sales_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'daily_sales',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'stock_purchases',
      new TableForeignKey({
        columnNames: ['product_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'CASCADE',
      }),
    );

    // 8. CREATE INVENTORY_TRANSFERS TABLE
    await queryRunner.createTable(
      new Table({
        name: 'inventory_transfers',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'daily_sales_id',
            type: 'uuid',
          },
          {
            name: 'from_product_id',
            type: 'uuid',
          },
          {
            name: 'to_product_id',
            type: 'uuid',
          },
          {
            name: 'quantity',
            type: 'int',
          },
          {
            name: 'conversion_rate',
            type: 'int',
          },
          {
            name: 'resulting_quantity',
            type: 'int',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Foreign keys for inventory_transfers
    await queryRunner.createForeignKey(
      'inventory_transfers',
      new TableForeignKey({
        columnNames: ['daily_sales_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'daily_sales',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'inventory_transfers',
      new TableForeignKey({
        columnNames: ['from_product_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'inventory_transfers',
      new TableForeignKey({
        columnNames: ['to_product_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'products',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'inventory_transfers',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.dropTable('inventory_transfers');
    await queryRunner.dropTable('stock_purchases');
    await queryRunner.dropTable('daily_expenses');
    await queryRunner.dropTable('daily_inventory');
    await queryRunner.dropTable('daily_sales');
    await queryRunner.dropTable('price_history');
    await queryRunner.dropTable('products');
    await queryRunner.dropTable('product_categories');
  }
}
