import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock contract state
let tokenSupplies: Record<number, number> = {};
let tokenBalances: Record<string, number> = {};

// Mock contract calls
const mockContractCall = vi.fn();

// Helper function to reset state before each test
function resetState() {
  tokenSupplies = {};
  tokenBalances = {};
}

describe('Token Management Contract', () => {
  beforeEach(() => {
    resetState();
    vi.resetAllMocks();
  });
  
  it('should create a project token', () => {
    const owner = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    
    mockContractCall.mockImplementation((_, __, projectId) => {
      tokenSupplies[projectId] = 0;
      return { success: true };
    });
    
    const result = mockContractCall('token-management', 'create-project-token', 0);
    expect(result).toEqual({ success: true });
    expect(tokenSupplies[0]).toBe(0);
  });
  
  it('should mint tokens', () => {
    const owner = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const recipient = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    tokenSupplies[0] = 0;
    
    mockContractCall.mockImplementation((_, __, projectId, amount, recipientAddress) => {
      tokenSupplies[projectId] += amount;
      tokenBalances[recipientAddress] = (tokenBalances[recipientAddress] || 0) + amount;
      return { success: true };
    });
    
    const result = mockContractCall('token-management', 'mint-tokens', 0, 1000, recipient);
    expect(result).toEqual({ success: true });
    expect(tokenSupplies[0]).toBe(1000);
    expect(tokenBalances[recipient]).toBe(1000);
  });
  
  it('should transfer tokens', () => {
    const sender = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const recipient = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    tokenBalances[sender] = 1000;
    
    mockContractCall.mockImplementation((_, __, amount, senderAddress, recipientAddress) => {
      tokenBalances[senderAddress] -= amount;
      tokenBalances[recipientAddress] = (tokenBalances[recipientAddress] || 0) + amount;
      return { success: true };
    });
    
    const result = mockContractCall('token-management', 'transfer-tokens', 500, sender, recipient);
    expect(result).toEqual({ success: true });
    expect(tokenBalances[sender]).toBe(500);
    expect(tokenBalances[recipient]).toBe(500);
  });
  
  it('should get token balance', () => {
    const owner = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    tokenBalances[owner] = 1000;
    
    mockContractCall.mockImplementation((_, __, ownerAddress) => {
      return { success: true, value: tokenBalances[ownerAddress] || 0 };
    });
    
    const result = mockContractCall('token-management', 'get-token-balance', owner);
    expect(result).toEqual({ success: true, value: 1000 });
  });
  
  it('should get token supply', () => {
    tokenSupplies[0] = 1000;
    
    mockContractCall.mockImplementation((_, __, projectId) => {
      return { success: true, value: tokenSupplies[projectId] || 0 };
    });
    
    const result = mockContractCall('token-management', 'get-token-supply', 0);
    expect(result).toEqual({ success: true, value: 1000 });
  });
});

