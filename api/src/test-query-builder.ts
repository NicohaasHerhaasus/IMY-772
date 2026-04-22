import { Pool } from 'pg';
import { QueryBuilderService, QueryBuilderFilters } from './application/services/query-builder.service';
import { writeFileSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';

// ── Setup ──────────────────────────────────────────────────────────────────

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'amr_db',
});

const service = new QueryBuilderService(pool);

// ── Tests ──────────────────────────────────────────────────────────────────

async function runTests() {
  try {
    console.log('\n=== Testing QueryBuilderService ===\n');

    // Test 1: Get dropdown options
    console.log('1️⃣  Fetching dropdown options...');
    const options = await service.getDropdownOptions();
    console.log(`   ✓ Found ${options.geoLocations.length} locations`);
    console.log(`   ✓ Found ${options.collectors.length} collectors`);
    console.log(`   ✓ Found ${options.amrGenes.length} AMR genes`);
    console.log(`   ✓ Found ${options.organisms.length} organisms`);
    console.log('   Sample locations:', options.geoLocations.slice(0, 3));
    console.log('');

    // Test 2: Query with basic filters
    console.log('2️⃣  Running basic query...');
    const filters: QueryBuilderFilters = {
      geo_loc_name: options.geoLocations[0] || 'River A', // Use first available
      collection_date_start: '2024-01-01',
      collection_date_end: '2024-12-31',
    };
    console.log(`   Filters:`, filters);

    const result = await service.query(filters);
    console.log(`   ✓ Found ${result.totalCount} samples`);
    console.log(`   ✓ Unique AMR genes: ${result.uniqueAmrGenes}`);
    console.log(`   ✓ Unique organisms: ${result.organisms}`);
    console.log(`   ✓ Match rate: ${result.matchRate}%`);
    if (result.rows.length > 0) {
      console.log(`   First row:`, result.rows[0]);
    }
    console.log('');

    // Test 3: Query with organism filter
    if (options.organisms.length > 0) {
      console.log('3️⃣  Query with organism filter...');
      const filtersWithOrganism: QueryBuilderFilters = {
        ...filters,
        organism: options.organisms[0],
      };
      console.log(`   Filters:`, filtersWithOrganism);

      const result2 = await service.query(filtersWithOrganism);
      console.log(`   ✓ Found ${result2.totalCount} samples with organism filter`);
      console.log('');
    }

    // Test 4: Query with AMR gene filter
    if (options.amrGenes.length > 0) {
      console.log('4️⃣  Query with AMR gene filter...');
      const filtersWithGene: QueryBuilderFilters = {
        ...filters,
        amr_resistance_gene: options.amrGenes[0],
      };
      console.log(`   Filters:`, filtersWithGene);

      const result3 = await service.query(filtersWithGene);
      console.log(`   ✓ Found ${result3.totalCount} samples with AMR gene filter`);
      console.log('');
    }

    // Test 5: Export CSV
    console.log('5️⃣  Testing CSV export...');
    const csvBuffer = await service.exportCsv(filters);
    const csvPath = join(__dirname, '..', 'query-results.csv');
    writeFileSync(csvPath, csvBuffer);
    console.log(`   ✓ Generated CSV: ${csvBuffer.length} bytes`);
    console.log(`   📁 Saved to: ${csvPath}`);
    console.log('');

    // Test 6: Export XLSX
    console.log('6️⃣  Testing XLSX export...');
    const xlsxBuffer = await service.exportXlsx(filters);
    const xlsxPath = join(__dirname, '..', 'query-results.xlsx');
    writeFileSync(xlsxPath, xlsxBuffer);
    console.log(`   ✓ Generated XLSX: ${xlsxBuffer.length} bytes`);
    console.log(`   📁 Saved to: ${xlsxPath}`);
    console.log('');
    console.log('   💡 Tip: Open the file in Excel or any spreadsheet app to view');

    console.log('✅ All tests passed!\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// ── Run ────────────────────────────────────────────────────────────────────

runTests();
