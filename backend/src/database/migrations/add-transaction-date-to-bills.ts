import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTransactionDateToBills1234567890123
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'bills',
      new TableColumn({
        name: 'transaction_date',
        type: 'date',
        isNullable: false,
        default: 'CURRENT_DATE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('bills', 'transaction_date');
  }
}
