import { Controller, Post, Body, Get } from '@nestjs/common';
import axios from 'axios';

@Controller('api/v1/polyglot-mesh')
export class ComputeController {
  @Get('nodes')
  async getMeshNodes() {
    // Listă de porturi pentru toate serviciile tale
    const ports = [
      { name: 'Brainfuck', port: 4020 }, { name: 'Python-ML', port: 4021 },
      { name: 'Go-Search', port: 4022 }, { name: 'Julia-Math', port: 4054 },
      { name: 'Prolog-Logic', port: 4055 }, { name: 'Haskell-Val', port: 4065 },
      { name: 'Elixir-Bus', port: 4067 }, { name: 'Assembly-Low', port: 4069 },
      { name: 'COBOL-Legacy', port: 4070 }, { name: 'Rust-Vault', port: 4071 },
      { name: 'Zig-Core', port: 4072 }, { name: 'Nim-Fast', port: 4073 },
      { name: 'Lua-Script', port: 4074 }, { name: 'PHP-Web', port: 4061 }
    ];
    return ports;
  }

  @Post('execute')
  async executeOnAll(@Body() body: any) {
    const nodes = [
      { name: 'Julia', url: 'http://julia-service:4054' },
      { name: 'Prolog', url: 'http://prolog-service:4055/check_fraud' },
      { name: 'Python', url: 'http://ml-service:4021/recommend' },
      { name: 'Haskell', url: 'http://haskell-service:4065' },
      { name: 'PHP', url: 'http://php-service:4061' }
    ];

    const results = await Promise.all(nodes.map(async node => {
      try {
        const res = await axios.get(node.url, { timeout: 1000 }).catch(() => axios.post(node.url, body, { timeout: 1000 }));
        return { node: node.name, status: 'OK', data: res.data };
      } catch (e) {
        return { node: node.name, status: 'TIMEOUT/ERROR', error: e.message };
      }
    }));

    return results;
  }
}
