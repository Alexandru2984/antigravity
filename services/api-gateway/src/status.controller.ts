import { Controller, Get } from '@nestjs/common';
import axios from 'axios';

@Controller('api/v1/polyglot-status')
export class StatusController {
  @Get()
  async getStatus() {
    const SERVICES = [
      { name: 'Brainfuck', queryPort: 4020, port: 4050, host: 'brainfuck-service' },
      { name: 'Assembly', queryPort: 4021, port: 4051, host: 'assembly-service' },
      { name: 'COBOL', queryPort: 4022, port: 4052, host: 'cobol-service' },
      { name: 'Clojure', queryPort: 4023, port: 4053, host: 'clojure-service' },
      { name: 'Julia', queryPort: 4054, port: 4054, host: 'julia-service' },
      { name: 'Prolog', queryPort: 4055, port: 4055, host: 'prolog-service' },
      { name: 'Elixir', queryPort: 4057, port: 4057, host: 'elixir-service' },
      { name: 'Scala', queryPort: 4058, port: 4058, host: 'scala-service' },
      { name: 'Lua', queryPort: 4059, port: 4059, host: 'lua-service' },
      { name: 'R', queryPort: 4060, port: 4060, host: 'r-service' },
      { name: 'PHP', queryPort: 4061, port: 4061, host: 'php-service' },
      { name: 'Zig', queryPort: 4062, port: 4062, host: 'zig-service' },
      { name: 'Swift', queryPort: 4063, port: 4063, host: 'swift-service' },
      { name: 'Nim', queryPort: 4064, port: 4064, host: 'nim-service' },
      { name: 'Haskell', queryPort: 4065, port: 4065, host: 'haskell-service' }
    ];

    return Promise.all(SERVICES.map(async (s) => {
      try {
        const start = Date.now();
        const res = await axios.get(`http://${s.host}:${s.queryPort}`, { timeout: 1500 });
        return { name: s.name, port: s.port, status: 'online', latency: Date.now() - start, response: res.data };
      } catch (e) {
        return { name: s.name, port: s.port, status: 'offline' };
      }
    }));
  }
}
