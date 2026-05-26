import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import axios from 'axios';
import { Public } from './auth/auth.guard';
import type { FastifyRequest } from 'fastify';
import { POLYGLOT_TRANSACTION_RATE_LIMIT } from './rate-limit/rate-limit';

const INTERNAL_SERVICE_TOKEN_HEADER = 'x-internal-service-token';
const DEFAULT_MAX_CONCURRENT_TRANSACTIONS = 2;
const MAX_STRING_LENGTH = 160;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_IMAGE_IDS = 10;
const MAX_ATTRIBUTES_BYTES = 4096;

const SERVICE_URL_DEFAULTS = {
  contractValidator: {
    env: 'CONTRACT_VALIDATOR_URL',
    url: 'http://contract-validator:4035',
  },
  prolog: { env: 'PROLOG_SERVICE_URL', url: 'http://prolog-service:4055' },
  clojure: { env: 'CLOJURE_SERVICE_URL', url: 'http://clojure-service:4023' },
  nim: { env: 'NIM_SERVICE_URL', url: 'http://nim-service:4064' },
  lua: { env: 'LUA_SERVICE_URL', url: 'http://lua-service:4059' },
  elixir: { env: 'ELIXIR_SERVICE_URL', url: 'http://elixir-service:4057' },
  scala: { env: 'SCALA_SERVICE_URL', url: 'http://scala-service:4058' },
  julia: { env: 'JULIA_SERVICE_URL', url: 'http://julia-service:4054' },
  r: { env: 'R_SERVICE_URL', url: 'http://r-service:4060' },
  php: { env: 'PHP_SERVICE_URL', url: 'http://php-service:4061' },
  ml: { env: 'ML_SERVICE_URL', url: 'http://ml-service:4012' },
  cobol: { env: 'COBOL_SERVICE_URL', url: 'http://cobol-service:4022' },
  assembly: {
    env: 'ASSEMBLY_SERVICE_URL',
    url: 'http://assembly-service:4021',
  },
  zig: { env: 'ZIG_SERVICE_URL', url: 'http://zig-service:4062' },
  swift: { env: 'SWIFT_SERVICE_URL', url: 'http://swift-service:4063' },
  brainfuck: {
    env: 'BRAINFUCK_SERVICE_URL',
    url: 'http://brainfuck-service:4020',
  },
  odin: { env: 'ODIN_SERVICE_URL', url: 'http://odin-service:4065' },
};

type ServiceUrlKey = keyof typeof SERVICE_URL_DEFAULTS;

interface MeshTransactionRequest {
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  location?: string;
  currency?: string;
  subcategory?: string;
  county?: string;
  lat?: number;
  lng?: number;
  imageIds?: string[];
  attributes?: Record<string, unknown>;
}

@Controller('api/v1/polyglot-mesh')
export class ComputeController {
  private activeTransactions = 0;

  @Public()
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
        port: 4012,
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
        port: 4020,
        description: 'Esoteric security hash Generation',
      },
      {
        name: 'Assembly-Fibo',
        language: 'Assembly',
        port: 4021,
        description: 'Hyper-optimized hardware signature matching',
      },
      {
        name: 'COBOL-Ledger',
        language: 'COBOL',
        port: 4022,
        description: 'Legacy mainframe merchant financial tracking',
      },
      {
        name: 'Clojure-Rules',
        language: 'Clojure',
        port: 4023,
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
        description: 'Mobile listing payload parsing',
      },
      {
        name: 'Nim-Optimizer',
        language: 'Nim',
        port: 4064,
        description: 'Static description text normalization',
      },
      {
        name: 'Odin-Speed',
        language: 'Odin',
        port: 4065,
        description: 'Low-level listing execution signal probe',
      },
    ];
  }

  @Post('transaction')
  @Throttle({ default: POLYGLOT_TRANSACTION_RATE_LIMIT })
  async executeTransaction(@Req() req: FastifyRequest, @Body() body: unknown) {
    if (!this.isMeshEnabled()) {
      throw new ServiceUnavailableException('Polyglot mesh is disabled');
    }

    const sellerId = this.authenticatedUserId(req);
    const releaseSlot = this.acquireTransactionSlot();
    try {
      return await this.executeTransactionCore(
        this.normalizeBody(body),
        sellerId,
      );
    } finally {
      releaseSlot();
    }
  }

  private async executeTransactionCore(
    body: MeshTransactionRequest,
    sellerId: string,
  ) {
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
        `${this.serviceUrl('contractValidator')}/validate`,
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
        `${this.serviceUrl('prolog')}/check_fraud`,
        {
          title: listing.title,
          price: listing.price,
          category: listing.category,
          seller_id: sellerId,
          location: listing.location,
        },
        { timeout: 1500 },
      );
      prologReport.status = 'online';
      prologReport.data = res.data;
    } catch (e) {
      prologReport.data = { error: e.message };
    }
    reports.push(prologReport);

    // Step 3: Clojure functional listing rules
    const clojureReport = {
      service: 'Clojure-Rules',
      status: 'offline',
      data: null as any,
    };
    try {
      const res = await axios.post(
        `${this.serviceUrl('clojure')}/rules`,
        {
          title: listing.title,
          description: body.description || '',
          price: listing.price,
          category: listing.category,
          location: listing.location,
        },
        { timeout: 1500 },
      );
      clojureReport.status = 'online';
      clojureReport.data = res.data;
    } catch (e) {
      clojureReport.data = { error: e.message };
    }
    reports.push(clojureReport);

    // Step 4: Nim text normalization and search token generation
    const nimReport = {
      service: 'Nim-Optimizer',
      status: 'offline',
      data: null as any,
    };
    try {
      const res = await axios.post(
        `${this.serviceUrl('nim')}/optimize`,
        {
          title: listing.title,
          description: body.description || '',
          category: listing.category,
          location: listing.location,
        },
        { timeout: 1500 },
      );
      nimReport.status = 'online';
      nimReport.data = res.data;
    } catch (e) {
      nimReport.data = { error: e.message };
    }
    reports.push(nimReport);

    // Step 5: Lua dynamic UI rendering hints
    const luaReport = {
      service: 'Lua-Customizer',
      status: 'offline',
      data: null as any,
    };
    try {
      const res = await axios.post(
        `${this.serviceUrl('lua')}/ui-rules`,
        {
          title: listing.title,
          category: listing.category,
          price: listing.price,
          risk_score: prologReport.data?.risk_score ?? 0,
          quality_score: clojureReport.data?.quality_score ?? 100,
          image_count: body.imageIds?.length ?? 0,
        },
        { timeout: 1500 },
      );
      luaReport.status = 'online';
      luaReport.data = res.data;
    } catch (e) {
      luaReport.data = { error: e.message };
    }
    reports.push(luaReport);

    // Step 6: Julia Statistics Analysis
    const juliaReport = {
      service: 'Julia-Stats',
      status: 'offline',
      data: null as any,
    };
    try {
      const prices = [
        Math.round(listing.price * 0.9),
        Math.round(listing.price * 1.15),
        Math.round(listing.price * 0.85),
        Math.round(listing.price * 1.05),
      ];
      const res = await axios.post(
        this.serviceUrl('julia'),
        { price: listing.price, comparables: prices },
        { timeout: 1500 },
      );
      juliaReport.status = 'online';
      juliaReport.data = res.data;
    } catch (e) {
      juliaReport.data = { error: e.message };
    }
    reports.push(juliaReport);

    // Step 7: R Statistical Linear Regression & Forecast
    const rReport = {
      service: 'R-Regression',
      status: 'offline',
      data: null as any,
    };
    try {
      const res = await axios.get(
        `${this.serviceUrl('r')}/forecast?price=${listing.price}`,
        { timeout: 1500 },
      );
      rReport.status = 'online';
      rReport.data = res.data;
    } catch (e) {
      rReport.data = { error: e.message };
    }
    reports.push(rReport);

    // Step 8: Python ML Recommendation Engine
    const pythonReport = {
      service: 'Python-ML',
      status: 'offline',
      data: null as any,
    };
    try {
      const res = await axios.post(
        `${this.serviceUrl('ml')}/recommend`,
        {
          title: listing.title,
          category: listing.category,
          price: listing.price,
          location: listing.location,
        },
        {
          timeout: 1500,
        },
      );
      pythonReport.status = 'online';
      pythonReport.data = res.data;
    } catch (e) {
      pythonReport.data = { error: e.message };
    }
    reports.push(pythonReport);

    // Step 9: COBOL Mainframe Billing Posting
    const cobolReport = {
      service: 'COBOL-Ledger',
      status: 'offline',
      data: null as any,
    };
    try {
      const amountCents = Math.round(listing.price * 100);
      const res = await axios.get(
        `${this.serviceUrl('cobol')}/ledger?amount_cents=${amountCents}`,
        {
          timeout: 1500,
        },
      );
      cobolReport.status = 'online';
      cobolReport.data = res.data;
    } catch (e) {
      cobolReport.data = { error: e.message };
    }
    reports.push(cobolReport);

    // Step 10: Assembly hyper-optimized mathematical payload validation
    const assemblyReport = {
      service: 'Assembly-Fibo',
      status: 'offline',
      data: null as any,
    };
    try {
      const verificationInput = Math.max(
        2,
        Math.min(45, Math.round(listing.price / 100)),
      );
      const res = await axios.get(
        `${this.serviceUrl('assembly')}/verify?n=${verificationInput}`,
        {
          timeout: 1500,
        },
      );
      assemblyReport.status = 'online';
      assemblyReport.data = res.data;
    } catch (e) {
      assemblyReport.data = { error: e.message };
    }
    reports.push(assemblyReport);

    // Step 11: Zig High-performance cryptographic checksumming
    const zigReport = {
      service: 'Zig-Crypto',
      status: 'offline',
      data: null as any,
    };
    try {
      const res = await axios.post(`${this.serviceUrl('zig')}/sign`, listing, {
        timeout: 1500,
      });
      zigReport.status = 'online';
      zigReport.data = res.data;
    } catch (e) {
      zigReport.data = { error: e.message };
    }
    reports.push(zigReport);

    // Step 12: Brainfuck esoteric verification signature
    const bfReport = {
      service: 'Brainfuck-Crypt',
      status: 'offline',
      data: null as any,
    };
    try {
      const res = await axios.post(
        `${this.serviceUrl('brainfuck')}/obfuscate`,
        listing,
        {
          timeout: 1500,
        },
      );
      bfReport.status = 'online';
      bfReport.data = res.data;
    } catch (e) {
      bfReport.data = { error: e.message };
    }
    reports.push(bfReport);

    // Step 13: Odin low-level runtime probe
    const odinReport = {
      service: 'Odin-Speed',
      status: 'offline',
      data: null as any,
    };
    try {
      const res = await axios.get(`${this.serviceUrl('odin')}/speed`, {
        timeout: 1500,
      });
      odinReport.status = 'online';
      odinReport.data = {
        service: 'odin-speed',
        signal: String(res.data).trim(),
      };
    } catch (e) {
      odinReport.data = { error: e.message };
    }
    reports.push(odinReport);

    // Step 14: PHP legacy compatibility probe
    const phpReport = {
      service: 'PHP-Legacy',
      status: 'offline',
      data: null as any,
    };
    try {
      const res = await axios.get(this.serviceUrl('php'), {
        timeout: 1500,
      });
      phpReport.status = 'online';
      phpReport.data = res.data;
    } catch (e) {
      phpReport.data = { error: e.message };
    }
    reports.push(phpReport);

    // Step 15: Swift mobile payload compatibility probe
    const swiftReport = {
      service: 'Swift-Mobile',
      status: 'offline',
      data: null as any,
    };
    try {
      const res = await axios.get(this.serviceUrl('swift'), {
        timeout: 1500,
      });
      swiftReport.status = 'online';
      swiftReport.data = res.data;
    } catch (e) {
      swiftReport.data = { error: e.message };
    }
    reports.push(swiftReport);

    // Step 16: Scala Akka routing probe
    const scalaReport = {
      service: 'Scala-Stream',
      status: 'offline',
      data: null as any,
    };
    try {
      const res = await axios.get(this.serviceUrl('scala'), {
        timeout: 1500,
      });
      scalaReport.status = 'online';
      scalaReport.data = res.data;
    } catch (e) {
      scalaReport.data = { error: e.message };
    }
    reports.push(scalaReport);

    // Step 17: Call Rust Listing service to persist in MongoDB and publish to Kafka
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
        const optimizedTitle =
          typeof nimReport.data?.normalized_title === 'string'
            ? nimReport.data.normalized_title
            : listing.title;
        const optimizedDescription =
          typeof nimReport.data?.normalized_description === 'string' &&
          nimReport.data.normalized_description.length > 0
            ? nimReport.data.normalized_description
            : body.description ||
              `Mesh validated transaction. Timestamp: ${new Date().toISOString()}`;
        const rustRes = await axios.post(
          `${listingServiceUrl}/listings`,
          {
            title: optimizedTitle,
            description: optimizedDescription,
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
            attributes: this.withMeshAttributes(body.attributes, reports),
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

      // Step 18: Elixir event broker notification after durable persistence
      if (rustReport.status === 'online') {
        const elixirReport = {
          service: 'Elixir-Broker',
          status: 'offline',
          data: null as any,
        };
        try {
          const res = await axios.post(
            `${this.serviceUrl('elixir')}/events`,
            {
              type: 'listing.created',
              listing_id: rustReport.data?.id || null,
              seller_id: sellerId,
              category: listing.category,
              price_cents: Math.round(listing.price * 100),
              mesh_online_nodes: reports
                .filter((report) => report.status === 'online')
                .map((report) => report.service),
            },
            { timeout: 1500 },
          );
          elixirReport.status = 'online';
          elixirReport.data = res.data;
        } catch (e) {
          elixirReport.data = { error: e.message };
        }
        reports.push(elixirReport);
      }
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

  private isMeshEnabled(): boolean {
    return process.env.POLYGLOT_MESH_ENABLED === 'true';
  }

  private serviceUrl(key: ServiceUrlKey): string {
    const service = SERVICE_URL_DEFAULTS[key];
    return process.env[service.env] || service.url;
  }

  private withMeshAttributes(
    attributes: Record<string, unknown> | undefined,
    reports: any[],
  ): Record<string, unknown> {
    const uiHints = this.reportData(reports, 'Lua-Customizer');

    return {
      ...(attributes || {}),
      ...(uiHints ? { ui_hints: uiHints } : {}),
      polyglot_mesh: {
        version: 1,
        evaluated_at: new Date().toISOString(),
        online_nodes: reports
          .filter((report) => report.status === 'online')
          .map((report) => report.service),
        reports: reports.reduce<Record<string, unknown>>((acc, report) => {
          acc[report.service] = {
            status: report.status,
            data: report.data,
          };
          return acc;
        }, {}),
      },
    };
  }

  private reportData(
    reports: any[],
    service: string,
  ): Record<string, unknown> | undefined {
    const report = reports.find(
      (candidate) =>
        candidate.service === service && candidate.status === 'online',
    );
    if (!report || !report.data || typeof report.data !== 'object') {
      return undefined;
    }

    return report.data as Record<string, unknown>;
  }

  private acquireTransactionSlot(): () => void {
    const maxConcurrent = this.maxConcurrentTransactions();
    if (this.activeTransactions >= maxConcurrent) {
      throw new HttpException(
        'Polyglot mesh concurrency limit reached',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.activeTransactions += 1;
    return () => {
      this.activeTransactions = Math.max(0, this.activeTransactions - 1);
    };
  }

  private maxConcurrentTransactions(): number {
    const raw = Number(process.env.POLYGLOT_MESH_MAX_CONCURRENCY);
    if (!Number.isInteger(raw) || raw < 1) {
      return DEFAULT_MAX_CONCURRENT_TRANSACTIONS;
    }

    return Math.min(raw, 10);
  }

  private normalizeBody(body: unknown): MeshTransactionRequest {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('Request body must be a JSON object');
    }

    const input = body as Record<string, unknown>;
    const normalized: MeshTransactionRequest = {
      title: this.optionalString(input.title, 'title', MAX_STRING_LENGTH),
      description: this.optionalString(
        input.description,
        'description',
        MAX_DESCRIPTION_LENGTH,
      ),
      price: this.optionalPrice(input.price),
      category: this.optionalString(input.category, 'category', 64),
      location: this.optionalString(input.location, 'location', 80),
      currency: this.optionalString(input.currency, 'currency', 8),
      subcategory: this.optionalString(input.subcategory, 'subcategory', 64),
      county: this.optionalString(input.county, 'county', 80),
      lat: this.optionalCoordinate(input.lat, 'lat', -90, 90),
      lng: this.optionalCoordinate(input.lng, 'lng', -180, 180),
      imageIds: this.optionalStringArray(input.imageIds, 'imageIds'),
      attributes: this.optionalAttributes(input.attributes),
    };

    if (input.sellerId !== undefined && input.sellerId !== null) {
      throw new BadRequestException('sellerId is derived from the auth token');
    }

    return normalized;
  }

  private authenticatedUserId(req: FastifyRequest): string {
    const user = (
      req as FastifyRequest & {
        user?: { sub?: string };
      }
    ).user;
    const sellerId = user?.sub;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!sellerId || !uuidRegex.test(sellerId)) {
      throw new BadRequestException('Authenticated user id must be a UUID');
    }

    return sellerId;
  }

  private optionalString(
    value: unknown,
    field: string,
    maxLength: number,
  ): string | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`${field} must be a string`);
    }

    const trimmed = value.trim();
    if (trimmed.length > maxLength) {
      throw new BadRequestException(`${field} is too long`);
    }

    return trimmed;
  }

  private optionalPrice(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const price = Number(value);
    if (!Number.isFinite(price) || price <= 0 || price > 1_000_000) {
      throw new BadRequestException('price must be between 0 and 1000000');
    }

    return price;
  }

  private optionalCoordinate(
    value: unknown,
    field: string,
    min: number,
    max: number,
  ): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const coordinate = Number(value);
    if (!Number.isFinite(coordinate) || coordinate < min || coordinate > max) {
      throw new BadRequestException(`${field} is out of range`);
    }

    return coordinate;
  }

  private optionalStringArray(
    value: unknown,
    field: string,
  ): string[] | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (!Array.isArray(value) || value.length > MAX_IMAGE_IDS) {
      throw new BadRequestException(`${field} must be a small string array`);
    }

    return value.map((item) => {
      if (typeof item !== 'string' || item.length > MAX_STRING_LENGTH) {
        throw new BadRequestException(`${field} contains an invalid item`);
      }
      return item;
    });
  }

  private optionalAttributes(
    value: unknown,
  ): Record<string, unknown> | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException('attributes must be an object');
    }

    if (JSON.stringify(value).length > MAX_ATTRIBUTES_BYTES) {
      throw new BadRequestException('attributes payload is too large');
    }

    return value as Record<string, unknown>;
  }
}
