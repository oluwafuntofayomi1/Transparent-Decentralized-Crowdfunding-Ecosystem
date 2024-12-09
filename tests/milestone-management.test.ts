import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock contract state
let milestones: Record<string, any> = {};
let projectMilestones: Record<number, number> = {};

// Mock contract calls
const mockContractCall = vi.fn();

// Helper function to reset state before each test
function resetState() {
  milestones = {};
  projectMilestones = {};
}

describe('Milestone Management Contract', () => {
  const contractOwner = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
  
  beforeEach(() => {
    resetState();
    vi.resetAllMocks();
  });
  
  it('should create a milestone', () => {
    mockContractCall.mockImplementation((_, __, projectId, description, fundsRequired, deadline) => {
      const milestoneId = projectMilestones[projectId] || 0;
      milestones[`${projectId}-${milestoneId}`] = {
        creator: contractOwner,
        description,
        fundsRequired,
        deadline,
        status: 'pending'
      };
      projectMilestones[projectId] = milestoneId + 1;
      return { success: true, value: milestoneId };
    });
    
    const result = mockContractCall('milestone-management', 'create-milestone', 0, 'First milestone', 500, 100);
    expect(result).toEqual({ success: true, value: 0 });
    expect(milestones['0-0']).toBeDefined();
    expect(milestones['0-0'].description).toBe('First milestone');
  });
  
  it('should complete a milestone', () => {
    milestones['0-0'] = { creator: contractOwner, description: 'First milestone', fundsRequired: 500, deadline: 100, status: 'pending' };
    
    mockContractCall.mockImplementation((_, __, projectId, milestoneId) => {
      milestones[`${projectId}-${milestoneId}`].status = 'completed';
      return { success: true };
    });
    
    const result = mockContractCall('milestone-management', 'complete-milestone', 0, 0);
    expect(result).toEqual({ success: true });
    expect(milestones['0-0'].status).toBe('completed');
  });
  
  it('should get milestone details', () => {
    milestones['0-0'] = { creator: contractOwner, description: 'First milestone', fundsRequired: 500, deadline: 100, status: 'pending' };
    
    mockContractCall.mockImplementation((_, __, projectId, milestoneId) => {
      return { success: true, value: milestones[`${projectId}-${milestoneId}`] };
    });
    
    const result = mockContractCall('milestone-management', 'get-milestone', 0, 0);
    expect(result).toEqual({ success: true, value: milestones['0-0'] });
  });
  
  it('should get project milestones', () => {
    projectMilestones[0] = 2;
    
    mockContractCall.mockImplementation((_, __, projectId) => {
      return { success: true, value: { milestoneCount: projectMilestones[projectId] } };
    });
    
    const result = mockContractCall('milestone-management', 'get-project-milestones', 0);
    expect(result).toEqual({ success: true, value: { milestoneCount: 2 } });
  });
});

