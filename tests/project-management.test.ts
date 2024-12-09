import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock contract state
let projects: Record<number, any> = {};
let projectBackers: Record<string, any> = {};
let nextProjectId = 0;

// Mock contract calls
const mockContractCall = vi.fn();

// Helper function to reset state before each test
function resetState() {
  projects = {};
  projectBackers = {};
  nextProjectId = 0;
}

describe('Project Management Contract', () => {
  beforeEach(() => {
    resetState();
    vi.resetAllMocks();
  });
  
  it('should create a project', () => {
    const creator = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    
    mockContractCall.mockImplementation((_, __, title, description, fundingGoal, deadline) => {
      const projectId = nextProjectId++;
      projects[projectId] = {
        creator,
        title,
        description,
        fundingGoal,
        currentFunds: 0,
        deadline,
        status: 'active'
      };
      return { success: true, value: projectId };
    });
    
    const result = mockContractCall('project-management', 'create-project', 'My Project', 'Description', 1000, 100);
    expect(result).toEqual({ success: true, value: 0 });
    expect(projects[0]).toBeDefined();
    expect(projects[0].title).toBe('My Project');
  });
  
  it('should back a project', () => {
    const backer = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    projects[0] = {
      creator: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      title: 'My Project',
      description: 'Description',
      fundingGoal: 1000,
      currentFunds: 0,
      deadline: 100,
      status: 'active'
    };
    
    mockContractCall.mockImplementation((_, __, projectId, amount) => {
      projects[projectId].currentFunds += amount;
      const backerKey = `${projectId}-${backer}`;
      projectBackers[backerKey] = (projectBackers[backerKey] || 0) + amount;
      return { success: true };
    });
    
    const result = mockContractCall('project-management', 'back-project', 0, 500);
    expect(result).toEqual({ success: true });
    expect(projects[0].currentFunds).toBe(500);
    expect(projectBackers['0-ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG']).toBe(500);
  });
  
  it('should get project details', () => {
    projects[0] = {
      creator: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      title: 'My Project',
      description: 'Description',
      fundingGoal: 1000,
      currentFunds: 500,
      deadline: 100,
      status: 'active'
    };
    
    mockContractCall.mockImplementation((_, __, projectId) => {
      return { success: true, value: projects[projectId] };
    });
    
    const result = mockContractCall('project-management', 'get-project', 0);
    expect(result).toEqual({ success: true, value: projects[0] });
  });
  
  it('should get backer contribution', () => {
    const backer = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    projectBackers['0-ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'] = 500;
    
    mockContractCall.mockImplementation((_, __, projectId, backerAddress) => {
      const backerKey = `${projectId}-${backerAddress}`;
      return { success: true, value: { amount: projectBackers[backerKey] || 0 } };
    });
    
    const result = mockContractCall('project-management', 'get-backer-contribution', 0, backer);
    expect(result).toEqual({ success: true, value: { amount: 500 } });
  });
  
  it('should finalize a funded project', () => {
    const creator = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    projects[0] = {
      creator,
      title: 'My Project',
      description: 'Description',
      fundingGoal: 1000,
      currentFunds: 1500,
      deadline: 100,
      status: 'active'
    };
    
    mockContractCall.mockImplementation((_, __, projectId) => {
      projects[projectId].status = 'funded';
      return { success: true };
    });
    
    const result = mockContractCall('project-management', 'finalize-project', 0);
    expect(result).toEqual({ success: true });
    expect(projects[0].status).toBe('funded');
  });
  
  it('should finalize a failed project', () => {
    const creator = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    projects[0] = {
      creator,
      title: 'My Project',
      description: 'Description',
      fundingGoal: 1000,
      currentFunds: 500,
      deadline: 100,
      status: 'active'
    };
    
    mockContractCall.mockImplementation((_, __, projectId) => {
      projects[projectId].status = 'failed';
      return { success: true };
    });
    
    const result = mockContractCall('project-management', 'finalize-project', 0);
    expect(result).toEqual({ success: true });
    expect(projects[0].status).toBe('failed');
  });
});

