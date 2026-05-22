import axios from 'axios';
import { ComputeController } from './compute.controller';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ComputeController', () => {
  let controller: ComputeController;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.POLYGLOT_MESH_ENABLED = 'true';
    process.env.INTERNAL_SERVICE_TOKEN = 'test-internal-token';
    process.env.CONTRACT_VALIDATOR_URL = 'http://contract-validator.test';
    process.env.PROLOG_SERVICE_URL = 'http://prolog.test';
    process.env.JULIA_SERVICE_URL = 'http://julia.test';
    process.env.R_SERVICE_URL = 'http://r.test';
    process.env.ML_SERVICE_URL = 'http://ml.test';
    process.env.COBOL_SERVICE_URL = 'http://cobol.test';
    process.env.ASSEMBLY_SERVICE_URL = 'http://assembly.test';
    process.env.ZIG_SERVICE_URL = 'http://zig.test';
    process.env.BRAINFUCK_SERVICE_URL = 'http://brainfuck.test';
    process.env.LISTING_SERVICE_URL = 'http://listing.test';
    controller = new ComputeController();
  });

  afterEach(() => {
    delete process.env.POLYGLOT_MESH_ENABLED;
    delete process.env.INTERNAL_SERVICE_TOKEN;
    delete process.env.CONTRACT_VALIDATOR_URL;
    delete process.env.PROLOG_SERVICE_URL;
    delete process.env.JULIA_SERVICE_URL;
    delete process.env.R_SERVICE_URL;
    delete process.env.ML_SERVICE_URL;
    delete process.env.COBOL_SERVICE_URL;
    delete process.env.ASSEMBLY_SERVICE_URL;
    delete process.env.ZIG_SERVICE_URL;
    delete process.env.BRAINFUCK_SERVICE_URL;
    delete process.env.LISTING_SERVICE_URL;
  });

  it('persists mesh reports as listing attributes', async () => {
    mockedAxios.post.mockImplementation((url: string, payload: unknown) => {
      if (url === 'http://contract-validator.test/validate') {
        return Promise.resolve({ data: { valid: true, errors: [] } });
      }
      if (url === 'http://prolog.test/check_fraud') {
        return Promise.resolve({
          data: {
            service: 'prolog-fraud',
            status: 'ok',
            risk_score: 0,
            triggered_rules: [],
          },
        });
      }
      if (url === 'http://julia.test') {
        return Promise.resolve({
          data: {
            status: 'ok',
            service: 'julia-stats',
            mean: 1185,
            std: 165.2271,
            z_score: 0.0908,
            outlier: false,
            engine: 'Julia-HighPerf-Stat',
          },
        });
      }
      if (url === 'http://zig.test/sign') {
        return Promise.resolve({
          data: {
            algorithm: 'sha256',
            digest: '7c56a550a0f4f50789d67c8a12aabf3b',
            bytes: JSON.stringify(payload).length,
            service: 'zig-crypto',
          },
        });
      }
      if (url === 'http://brainfuck.test/obfuscate') {
        return Promise.resolve({
          data: {
            service: 'brainfuck-crypt',
            algorithm: 'fnv1a-bf-obfuscation',
            signature: 'd4e5028f',
            bytes: JSON.stringify(payload).length,
          },
        });
      }
      if (url === 'http://ml.test/recommend') {
        return Promise.resolve({
          data: {
            service: 'python-ml',
            model: 'category-price-ranker-v1',
            category: 'electronics',
            price_band: 'mid_market',
            recommendations: [
              {
                item: 'USB-C docking station',
                score: 0.92,
                reason: 'electronics:mid_market',
              },
            ],
          },
        });
      }
      if (url === 'http://listing.test/listings') {
        return Promise.resolve({ data: { id: 'mongo123', payload } });
      }
      return Promise.reject(new Error(`unexpected POST ${url}`));
    });

    mockedAxios.get.mockImplementation((url: string) => {
      const responses: Record<string, unknown> = {
        'http://r.test/forecast?price=1200': {
          status: 'ok',
          service: 'r-regression',
          engine: 'R-Stats-Regression',
          input_price: 1200,
          forecast_price_45_days: 1115.83,
        },
        'http://cobol.test/ledger?amount_cents=120000': {
          service: 'cobol-ledger',
          tax_bps: 1900,
          amount_cents: 120000,
          tax_cents: 22800,
          total_cents: 142800,
        },
        'http://assembly.test/verify?n=12': {
          service: 'assembly-fibo',
          algorithm: 'fibonacci',
          input: 12,
          result: 144,
        },
      };
      if (url in responses) {
        return Promise.resolve({ data: responses[url] });
      }
      return Promise.reject(new Error(`unexpected GET ${url}`));
    });

    const result = await controller.executeTransaction({
      title: 'MacBook Pro M3',
      price: 1200,
      category: 'electronics',
      sellerId: 'seller-100',
      attributes: { source: 'test' },
    });

    expect(result.status).toBe('SUCCESS_PERSISTED');
    expect(mockedAxios.post.mock.calls).toContainEqual([
      'http://ml.test/recommend',
      {
        title: 'MacBook Pro M3',
        category: 'electronics',
        price: 1200,
        location: 'Bucuresti',
      },
      { timeout: 1500 },
    ]);

    const listingCall = mockedAxios.post.mock.calls.find(
      ([url]) => url === 'http://listing.test/listings',
    );
    expect(listingCall).toBeDefined();

    const listingPayload = listingCall?.[1] as Record<string, any>;
    expect(listingPayload.attributes.source).toBe('test');
    expect(
      listingPayload.attributes.polyglot_mesh.reports['Julia-Stats'].data.std,
    ).toBe(165.2271);
    expect(
      listingPayload.attributes.polyglot_mesh.reports['Julia-Stats'].data
        .outlier,
    ).toBe(false);
    expect(
      listingPayload.attributes.polyglot_mesh.reports['Prolog-Fraud'].data
        .risk_score,
    ).toBe(0);
    expect(
      listingPayload.attributes.polyglot_mesh.reports['R-Regression'].data
        .forecast_price_45_days,
    ).toBe(1115.83);
    expect(
      listingPayload.attributes.polyglot_mesh.reports['Python-ML'].data
        .price_band,
    ).toBe('mid_market');
    expect(
      listingPayload.attributes.polyglot_mesh.reports['Zig-Crypto'].data
        .algorithm,
    ).toBe('sha256');
    expect(
      listingPayload.attributes.polyglot_mesh.reports['Assembly-Fibo'].data
        .result,
    ).toBe(144);
    expect(
      listingPayload.attributes.polyglot_mesh.reports['COBOL-Ledger'].data
        .total_cents,
    ).toBe(142800);
    expect(
      listingPayload.attributes.polyglot_mesh.reports['Brainfuck-Crypt'].data
        .algorithm,
    ).toBe('fnv1a-bf-obfuscation');
    expect(listingPayload.attributes.polyglot_mesh.online_nodes).toContain(
      'Brainfuck-Crypt',
    );
  });
});
