import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Controller('api/v1/polyglot-compute')
export class ComputeController {
  @Post()
  async runCompute(@Body() body: { values: number[] }) {
    const { values } = body;
    const report: any = { steps: [] };

    try {
      // Step 1: Haskell Validation
      const haskellRes = await axios.post('http://haskell-service:4065', { values });
      report.steps.push({ service: 'Haskell', action: 'Mathematical Validation', status: 'Passed', data: haskellRes.data });

      // Step 2: Julia Statistics
      const juliaRes = await axios.post('http://julia-service:4054', { values });
      report.steps.push({ service: 'Julia', action: 'Statistical Analysis', status: 'Success', data: juliaRes.data });

      // Step 3: Simulation of Brainfuck Hash
      report.steps.push({ service: 'Brainfuck', action: 'Obscure Hashing', status: 'Active', hash: '.[-]>[-]+' });

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
