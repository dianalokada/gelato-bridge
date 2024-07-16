import { Web3Function, Web3FunctionContext } from '@gelatonetwork/web3-functions-sdk';
import { Contract, ethers, EventLog, Result, Log } from 'ethers';
import { GelatoRelay } from '@gelatonetwork/relay-sdk';
import * as config from '../config';

jest.mock('@gelatonetwork/web3-functions-sdk');
jest.mock('ethers');
jest.mock('@gelatonetwork/relay-sdk');
jest.mock('./config');

import { onRun } from './web3func';

describe('Web3Function', () => {
  let mockContext: Web3FunctionContext;
  let mockContract: jest.Mocked<Contract>;
  let mockRelay: jest.Mocked<GelatoRelay>;

  beforeEach(() => {
    jest.resetAllMocks();

    mockContext = {} as Web3FunctionContext;

    mockContract = {
      filters: { TokensBurned: jest.fn().mockReturnValue({}) },
      queryFilter: jest.fn(),
      interface: {
        encodeFunctionData: jest.fn().mockReturnValue('0x456...'),
      },
    } as unknown as jest.Mocked<Contract>;

    mockRelay = { sponsoredCall: jest.fn() } as unknown as jest.Mocked<GelatoRelay>;

    (ethers.Contract as jest.MockedClass<typeof ethers.Contract>).mockImplementation(
      () => mockContract,
    );
    (GelatoRelay as jest.MockedClass<typeof GelatoRelay>).mockImplementation(() => mockRelay);

    (config as jest.Mocked<typeof config>).contractAddressArbitrumSepolia = 'mock-arbitrum-address';
    (config as jest.Mocked<typeof config>).contractAddressOptimismSepolia = 'mock-optimism-address';
    (config as jest.Mocked<typeof config>).gelatoApiKey = 'mock-gelato-api-key';

    (Web3Function.onRun as jest.Mock).mockImplementation((handler) => {
      (global as any).storedHandler = handler;
    });
  });

  it('should process events and relay transactions', async () => {
    const mockEvent = {
      args: ['0x123...', ethers.parseEther('100')],
    } as unknown as EventLog;
    mockContract.queryFilter.mockResolvedValue([mockEvent]);

    onRun(mockContext);
    const result = await (global as any).storedHandler(mockContext);

    expect(mockRelay.sponsoredCall).toHaveBeenCalledWith(
      expect.objectContaining({
        chainId: expect.any(BigInt),
        target: expect.any(String),
        data: '0x456...',
      }),
      'mock-gelato-api-key',
    );
    expect(result).toEqual({
      canExec: false,
      message: 'Processed events and relayed transactions',
    });
  });

  it('should process events from both chains', async () => {
    const mockEvent = {
      args: ['0x123...', ethers.parseEther('100')],
    } as unknown as EventLog;
    mockContract.queryFilter.mockResolvedValue([mockEvent]);

    onRun(mockContext);
    const result = await (global as any).storedHandler(mockContext);

    expect(mockContract.queryFilter).toHaveBeenCalledTimes(2);
    expect(mockRelay.sponsoredCall).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      canExec: false,
      message: 'Processed events and relayed transactions',
    });
  });

  it('should handle errors', async () => {
    mockContract.queryFilter.mockRejectedValue(new Error('Mock error'));

    onRun(mockContext);
    const result = await (global as any).storedHandler(mockContext);

    expect(result).toEqual({ canExec: false, message: 'Error occurred: Mock error' });
  });

  it('should use correct chain IDs', async () => {
    const mockEvent = {
      args: ['0x123...', ethers.parseEther('100')],
    } as unknown as EventLog;
    mockContract.queryFilter.mockResolvedValue([mockEvent]);

    onRun(mockContext);
    await (global as any).storedHandler(mockContext);

    expect(mockRelay.sponsoredCall).toHaveBeenCalledWith(
      expect.objectContaining({ chainId: BigInt(11155420) }),
      expect.any(String),
    );
    expect(mockRelay.sponsoredCall).toHaveBeenCalledWith(
      expect.objectContaining({ chainId: BigInt(421614) }),
      expect.any(String),
    );
  });

  it('should process multiple events', async () => {
    const mockEvents = [
      { args: ['0x123...', ethers.parseEther('100')] },
      { args: ['0x456...', ethers.parseEther('200')] },
    ] as unknown as EventLog[];
    mockContract.queryFilter.mockResolvedValue(mockEvents);

    onRun(mockContext);
    const result = await (global as any).storedHandler(mockContext);

    expect(mockRelay.sponsoredCall).toHaveBeenCalledTimes(4); // 2 events * 2 chains
    expect(result).toEqual({
      canExec: false,
      message: 'Processed events and relayed transactions',
    });
  });

  it('should not relay if no events are found', async () => {
    mockContract.queryFilter.mockResolvedValue([]);

    onRun(mockContext);
    const result = await (global as any).storedHandler(mockContext);

    expect(mockRelay.sponsoredCall).not.toHaveBeenCalled();
    expect(result).toEqual({
      canExec: false,
      message: 'Processed events and relayed transactions',
    });
  });
});
