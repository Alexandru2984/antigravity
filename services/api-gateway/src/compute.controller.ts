import { Controller, Post, Body, Get } from '@nestjs/common';
import axios from 'axios';
import { Public } from './auth/auth.guard';

const INTERNAL_SERVICE_TOKEN_HEADER = 'x-internal-service-token';

@Public()
@Controller('api/v1/polyglot-mesh')
export class ComputeController {
  @Get('nodes')
  async getMeshNodes() {
    return [
      {
        name: 'Rust-Core',
        language: 'Rust',
        port: 4002,
        description: 'Core CRUD Operations & MongoDB Interface',
      },
      {
        name: 'C++-Images',
        language: 'C++',
        port: 4004,
        description: 'High-speed image processing & metadata extraction',
      },
      {
        name: 'Go-Feed',
        language: 'Go',
        port: 4008,
        description: 'High-throughput social activity streams & caching',
      },
      {
        name: 'PHP-Reviews',
        language: 'PHP',
        port: 4009,
        description: 'Customer reviews & feedback tracking',
      },
      {
        name: 'Python-ML',
        language: 'Python',
        port: 4028,
        description: 'Neo4j-powered recommendations',
      },
      {
        name: 'Haskell-Validator',
        language: 'Haskell',
        port: 4035,
        description: 'Formal mathematical contract verification',
      },
      {
        name: 'Brainfuck-Crypt',
        language: 'Brainfuck',
        port: 4050,
        description: 'Esoteric security hash Generation',
      },
      {
        name: 'Assembly-Fibo',
        language: 'Assembly',
        port: 4051,
        description: 'Hyper-optimized hardware signature matching',
      },
      {
        name: 'COBOL-Ledger',
        language: 'COBOL',
        port: 4052,
        description: 'Legacy mainframe merchant financial tracking',
      },
      {
        name: 'Clojure-Rules',
        language: 'Clojure',
        port: 4053,
        description: 'Functional marketing rules compiler',
      },
      {
        name: 'Julia-Stats',
        language: 'Julia',
        port: 4054,
        description: 'Pricing analysis & real-time standard deviation',
      },
      {
        name: 'Prolog-Fraud',
        language: 'Prolog',
        port: 4055,
        description: 'Logical expert system for fraud screening',
      },
      {
        name: 'Elixir-Broker',
        language: 'Elixir',
        port: 4057,
        description: 'Real-time WebSocket event dispatching',
      },
      {
        name: 'Scala-Stream',
        language: 'Scala',
        port: 4058,
        description: 'Kafka event broker stream processor',
      },
      {
        name: 'Lua-Customizer',
        language: 'Lua',
        port: 4059,
        description: 'Dynamic UI rendering rules processor',
      },
      {
        name: 'R-Regression',
        language: 'R',
        port: 4060,
        description: 'Statistical linear pricing regression & forecasting',
      },
      {
        name: 'Zig-Crypto',
        language: 'Zig',
        port: 4062,
        description: 'Zero-dependency binary cryptographic hashing',
      },
      {
        name: 'Swift-Mobile',
        language: 'Swift',
        port: 4063,
        description: 'Mobile listing payload payload parsing',
      },
      {
        name: 'Nim-Optimizer',
        language: 'Nim',
        port: 4064,
        description: 'Static description text normalization',
      },
    ];
  }

  @Post('transaction')
  async executeTransaction(@Body() body: any) {
    // Ensure sellerId is a valid UUID, generate a deterministic one if not
    let sellerId = body.sellerId || '00000000-0000-0000-0000-000000000100';
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sellerId)) {
      if (sellerId.includes('vendor') || sellerId.includes('premium')) {
        sellerId = '11111111-1111-1111-1111-111111111111';
      } else if (sellerId.includes('seller') || sellerId.includes('100')) {
        sellerId = '22222222-2222-2222-2222-222222222222';
      } else {
        sellerId = '00000000-0000-0000-0000-000000000100';
      }
    }

    const listing = {
      title: body.title || 'Demo Listing Item',
      price: Number(body.price) || 250,
      category: body.category || 'electronics',
      seller_id: sellerId,
      location: body.location || 'Bucuresti',
    };

    const startTime = Date.now();
    const reports: any[] = [];

    // Step 1: Haskell Contract Validation (Formal validation)
    const haskellReport = {
      service: 'Haskell-Validator',
      status: 'offline',
      data: null as any,
    };
    try {
      const res = await axios.post(
        'http://contract-validator:4035/validate',
        {
          payload: listing,
          schemaName: 'listing',
        },
        { timeout: 1500 },
      );
      haskellReport.status = 'online';
      haskellReport.data = res.data;
    } catch (e) {
      haskellReport.data = { error: e.message };
    }
    reports.push(haskellReport);

    // Step 2: Prolog Fraud Screening
    const prologReport = {
      service: 'Prolog-Fraud',
      status: 'offline',
      data: null as any,
    };
    try {
      const res = await axios.post(
        'http://prolog-service:4055/check_fraud',
        {
          price: listing.price,
          category: listing.category,
        },
        { timeout: 1500 },
      );
      prologReport.status = 'online';
      prologReport.data = res.data;
    } catch (e) {
      prologReport.data = { error: e.message };
    }
    reports.push(prologReport);

    // Step 3: Julia Statistics Analysis
    const juliaReport = {
      service: 'Julia-Stats',
      status: 'offline',
      data: null as any,
    };
    try {
      const prices = [
        listing.price,
        Math.round(listing.price * 0.9),
        Math.round(listing.price * 1.15),
        Math.round(listing.price * 0.85),
      ];
      const res = await axios.post(
        'http://julia-service:4054',
        { data: prices },
        { timeout: 1500 },
      );
      juliaReport.status = 'online';
      juliaReport.data = res.data;
    } catch (e) {
      juliaReport.data = { error: e.message };
    }
    reports.push(juliaReport);

    // Step 4: R Statistical Linear Regression & Forecast
    const rReport = {
      service: 'R-Regression',
      status: 'offline',
      data: null as any,
    };
    try {
      const res = await axios.get('http://r-service:4060', { timeout: 1500 });
      rReport.status = 'online';
      rReport.data = res.data;
    } catch (e) {
      rReport.data = { error: e.message };
    }
    reports.push(rReport);

    // Step 5: Python ML Recommendation Engine
    const pythonReport = {
      service: 'Python-ML',
      status: 'offline',
      data: null as any,
    };
    try {
      const res = await axios.get('http://ml-service:4028/recommend', {
        timeout: 1500,
      });
      pythonReport.status = 'online';
      pythonReport.data = res.data;
    } catch (e) {
      pythonReport.data = { error: e.message };
    }
    reports.push(pythonReport);

    // Step 6: COBOL Mainframe Billing Posting
    const cobolReport = {
      service: 'COBOL-Ledger',
      status: 'offline',
      data: null as any,
    };
    try {
      const res = await axios.get('http://cobol-service:4022', {
        timeout: 1500,
      });
      cobolReport.status = 'online';
      cobolReport.data = { message: res.data.trim() };
    } catch (e) {
      cobolReport.data = { error: e.message };
    }
    reports.push(cobolReport);

    // Step 7: Assembly hyper-optimized mathematical payload validation
    const assemblyReport = {
      service: 'Assembly-Fibo',
      status: 'offline',
      data: null as any,
    };
    try {
      const res = await axios.get('http://assembly-service:4021', {
        timeout: 1500,
      });
      assemblyReport.status = 'online';
      assemblyReport.data = { message: res.data.trim() };
    } catch (e) {
      assemblyReport.data = { error: e.message };
    }
    reports.push(assemblyReport);

    // Step 8: Zig High-performance cryptographic checksumming
    const zigReport = {
      service: 'Zig-Crypto',
      status: 'offline',
      data: null as any,
    };
    try {
      const res = await axios.get('http://zig-service:4062', { timeout: 1500 });
      zigReport.status = 'online';
      zigReport.data = { message: res.data.trim() };
    } catch (e) {
      zigReport.data = { error: e.message };
    }
    reports.push(zigReport);

    // Step 9: Brainfuck esoteric verification signature
    const bfReport = {
      service: 'Brainfuck-Crypt',
      status: 'offline',
      data: null as any,
    };
    try {
      const res = await axios.get('http://brainfuck-service:4020', {
        timeout: 1500,
      });
      bfReport.status = 'online';
      bfReport.data = { signature: res.data.trim() };
    } catch (e) {
      bfReport.data = { error: e.message };
    }
    reports.push(bfReport);

    // Step 10: Call Rust Listing service to persist in MongoDB and publish to Kafka
    const rustReport = {
      service: 'Rust-Persist-Core',
      status: 'offline',
      data: null as any,
    };
    const isContractValid =
      haskellReport.status === 'online' && haskellReport.data?.valid === true;

    if (isContractValid) {
      try {
        const listingServiceUrl =
          process.env.LISTING_SERVICE_URL || 'http://listing-service:4022';
        const internalServiceToken = process.env.INTERNAL_SERVICE_TOKEN;
        if (!internalServiceToken) {
          throw new Error('INTERNAL_SERVICE_TOKEN is not configured');
        }
        const rustRes = await axios.post(
          `${listingServiceUrl}/listings`,
          {
            title: listing.title,
            description:
              body.description ||
              `Mesh validated transaction. Timestamp: ${new Date().toISOString()}`,
            price: Math.round(listing.price * 100), // convert to cents/bani
            currency: body.currency || 'RON',
            category: listing.category,
            subcategory: body.subcategory || 'general',
            location: {
              city: listing.location,
              county: body.county || 'Bucuresti',
              lat: body.lat ? Number(body.lat) : 44.4268,
              lng: body.lng ? Number(body.lng) : 26.1025,
            },
            image_ids: body.imageIds || [],
            attributes: body.attributes || {},
          },
          {
            headers: {
              'x-user-id': sellerId,
              [INTERNAL_SERVICE_TOKEN_HEADER]: internalServiceToken,
              'Content-Type': 'application/json',
            },
            timeout: 3000,
          },
        );
        rustReport.status = 'online';
        rustReport.data = rustRes.data;
      } catch (e: any) {
        rustReport.status = 'error';
        rustReport.data = {
          error: e.message,
          details: e.response?.data || null,
        };
      }
      reports.push(rustReport);
    }

    const duration = Date.now() - startTime;

    return {
      status:
        rustReport.status === 'online'
          ? 'SUCCESS_PERSISTED'
          : 'PARTIAL_SUCCESS',
      timestamp: new Date().toISOString(),
      transactionDetails: {
        ...listing,
        mongo_id: rustReport.data?.id || null,
      },
      durationMs: duration,
      nodeReports: reports,
    };
  }
}
