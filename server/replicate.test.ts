/**
 * Replicate API 测试
 */

import { describe, it, expect } from 'vitest';
import { isReplicateAvailable } from './lib/replicate';
import Replicate from 'replicate';
import { env } from './_core/env';

describe('Replicate API', () => {
  it('should have REPLICATE_API_TOKEN configured', () => {
    expect(env.replicateApiToken).toBeTruthy();
    expect(env.replicateApiToken.length).toBeGreaterThan(0);
  });

  it('should validate Replicate API token', async () => {
    expect(isReplicateAvailable()).toBe(true);
    
    // 测试 API token 是否有效
    const client = new Replicate({
      auth: env.replicateApiToken,
    });
    
    // 调用一个简单的 API 来验证 token
    // 使用 account.get() 方法验证
    const account = await client.accounts.current();
    
    expect(account).toBeDefined();
    expect(account.username).toBeTruthy();
  }, 30000); // 30秒超时
});
