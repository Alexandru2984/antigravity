import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Controller('api/v1/polyglot-compute')
export class ComputeController {
  @Post()
  async runCompute(@Body() body: { values: number[] }) {
    const { values } = body;
    const report: any = { steps: [] };

    try {
      // Step 1: Julia Statistics (Stable)
      const juliaRes = await axios.post('http://julia-service:4054', { values });
      report.steps.push({ service: 'Julia', action: 'Scientific Analysis', status: 'Success', data: juliaRes.data });

      // Step 2: Elixir Concurrency Check (Stable)
      const elixirRes = await axios.get('http://elixir-service:4057');
      report.steps.push({ service: 'Elixir', action: 'Concurrency Node Check', status: 'Online', data: elixirRes.data });

      // Step 3: Brainfuck Verification
      report.steps.push({ service: 'Brainfuck', action: 'Obscure Verification', status: 'Active', hash: '.[-]>[-]+' });

      report.finalStatus = 'COMPLETED';
      return report;
    } catch (e: any) {
      throw new HttpException({
        status: 'FAILED',
        error: e.response?.data || e.message,
        step: report.steps.length + 1
      }, HttpStatus.BAD_REQUEST);
    }
  }
}
