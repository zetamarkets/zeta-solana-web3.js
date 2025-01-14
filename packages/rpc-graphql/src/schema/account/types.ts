import { GraphQLInterfaceType, GraphQLObjectType, GraphQLScalarType } from 'graphql';

import { accountEncodingInputType, commitmentInputType, dataSliceInputType } from '../inputs';
import { bigint, boolean, list, number, object, string, type } from '../picks';

let memoisedTokenAmountType: GraphQLObjectType | undefined;
export const tokenAmountType = () => {
    if (!memoisedTokenAmountType) {
        memoisedTokenAmountType = new GraphQLObjectType({
            fields: {
                amount: string(),
                decimals: number(),
                uiAmount: bigint(),
                uiAmountString: string(),
            },
            name: 'TokenAmount',
        });
    }
    return memoisedTokenAmountType;
};

/**
 * The fields of the account interface
 */
let memoisedAccountInterfaceFields: object | undefined;
const accountInterfaceFields = () => {
    if (!memoisedAccountInterfaceFields) {
        memoisedAccountInterfaceFields = {
            encoding: string(),
            executable: boolean(),
            lamports: bigint(),
            rentEpoch: bigint(),
        };
    }
    return memoisedAccountInterfaceFields;
};

/**
 * An account interface for GraphQL
 */
let memoisedAccountInterface: GraphQLInterfaceType | undefined;
export const accountInterface = (): GraphQLInterfaceType => {
    if (!memoisedAccountInterface) {
        memoisedAccountInterface = new GraphQLInterfaceType({
            description: 'A Solana account',
            fields: () => ({
                ...accountInterfaceFields(),
                owner: type(accountInterface()),
            }),
            name: 'Account',
            resolveType(account) {
                if (account.encoding === 'base58') {
                    return 'AccountBase58';
                }
                if (account.encoding === 'base64') {
                    return 'AccountBase64';
                }
                if (account.encoding === 'base64+zstd') {
                    return 'AccountBase64Zstd';
                }
                if (account.encoding === 'jsonParsed') {
                    if (account.data.parsed.type === 'mint' && account.data.program === 'spl-token') {
                        return 'MintAccount';
                    }
                    if (account.data.parsed.type === 'account' && account.data.program === 'spl-token') {
                        return 'TokenAccount';
                    }
                    if (account.data.program === 'nonce') {
                        return 'NonceAccount';
                    }
                    if (account.data.program === 'stake') {
                        return 'StakeAccount';
                    }
                    if (account.data.parsed.type === 'vote' && account.data.program === 'vote') {
                        return 'VoteAccount';
                    }
                    if (account.data.parsed.type === 'lookupTable' && account.data.program === 'address-lookup-table') {
                        return 'LookupTableAccount';
                    }
                }
                return 'AccountBase64';
            },
        });
    }
    return memoisedAccountInterface;
};

/**
 * An account type implementing the account interface with a
 * specified data encoding structure
 * @param name          The name of the account type
 * @param description   The description of the account type
 * @param data          The data structure of the account type
 * @returns             The account type as a GraphQL object implementing the account interface
 */
const accountType = (
    name: string,
    description: string,
    data: { type: GraphQLScalarType | GraphQLObjectType }
): GraphQLObjectType =>
    new GraphQLObjectType({
        description,
        fields: {
            ...accountInterfaceFields(),
            data,
            owner: {
                args: {
                    commitment: type(commitmentInputType()),
                    dataSlice: type(dataSliceInputType()),
                    encoding: type(accountEncodingInputType()),
                    minContextSlot: bigint(),
                },
                resolve: (parent, args, context) => context.resolveAccount({ ...args, address: parent.owner }),
                type: accountInterface(),
            },
        },
        interfaces: [accountInterface()],
        name,
    });

/**
 * Builds JSON parsed account data
 * Note: JSON parsed data is only available for account types with known schemas.
 * Any account with an unknown schema will return base64 encoded data.
 * @see https://docs.solana.com/api/http#parsed-responses
 * @param name              The name of the account type
 * @param parsedInfoFields  The fields of the parsed info object
 * @returns                 The JSON parsed account data as a GraphQL object
 */
const accountDataJsonParsed = (name: string, parsedInfoFields: Parameters<typeof object>[1]) =>
    object(name + 'Data', {
        parsed: object(name + 'DataParsed', {
            info: object(name + 'DataParsedInfo', parsedInfoFields),
            type: string(),
        }),
        program: string(),
        space: bigint(),
    });

let memoisedAccountBase58: GraphQLObjectType | undefined;
const accountBase58 = () => {
    if (!memoisedAccountBase58)
        memoisedAccountBase58 = accountType('AccountBase58', 'A Solana account with base58 encoded data', string());
    return memoisedAccountBase58;
};

let memoisedAccountBase64: GraphQLObjectType | undefined;
const accountBase64 = () => {
    if (!memoisedAccountBase64)
        memoisedAccountBase64 = accountType('AccountBase64', 'A Solana account with base64 encoded data', string());
    return memoisedAccountBase64;
};

let memoisedAccountBase64Zstd: GraphQLObjectType | undefined;
const accountBase64Zstd = () => {
    if (!memoisedAccountBase64Zstd)
        memoisedAccountBase64Zstd = accountType(
            'AccountBase64Zstd',
            'A Solana account with base64 encoded data compressed with zstd',
            string()
        );
    return memoisedAccountBase64Zstd;
};

let memoisedAccountNonceAccount: GraphQLObjectType | undefined;
const accountNonceAccount = () => {
    if (!memoisedAccountNonceAccount)
        memoisedAccountNonceAccount = accountType(
            'NonceAccount',
            'A nonce account',
            accountDataJsonParsed('Nonce', {
                authority: string(),
                blockhash: string(),
                feeCalculator: object('NonceFeeCalculator', {
                    lamportsPerSignature: string(),
                }),
            })
        );
    return memoisedAccountNonceAccount;
};

let memoisedAccountLookupTable: GraphQLObjectType | undefined;
const accountLookupTable = () => {
    if (!memoisedAccountLookupTable)
        memoisedAccountLookupTable = accountType(
            'LookupTableAccount',
            'An address lookup table account',
            accountDataJsonParsed('LookupTable', {
                addresses: list(string()),
                authority: string(),
                deactivationSlot: string(),
                lastExtendedSlot: string(),
                lastExtendedSlotStartIndex: number(),
            })
        );
    return memoisedAccountLookupTable;
};

let memoisedAccountMint: GraphQLObjectType | undefined;
const accountMint = () => {
    if (!memoisedAccountMint)
        memoisedAccountMint = accountType(
            'MintAccount',
            'An SPL mint',
            accountDataJsonParsed('Mint', {
                decimals: number(),
                freezeAuthority: string(),
                isInitialized: boolean(),
                mintAuthority: string(),
                supply: string(),
            })
        );
    return memoisedAccountMint;
};

let memoisedAccountTokenAccount: GraphQLObjectType | undefined;
const accountTokenAccount = () => {
    if (!memoisedAccountTokenAccount)
        memoisedAccountTokenAccount = accountType(
            'TokenAccount',
            'An SPL token account',
            accountDataJsonParsed('TokenAccount', {
                isNative: boolean(),
                mint: string(),
                owner: string(),
                state: string(),
                tokenAmount: type(tokenAmountType()),
            })
        );
    return memoisedAccountTokenAccount;
};

let memoisedAccountStakeAccount: GraphQLObjectType | undefined;
const accountStakeAccount = () => {
    if (!memoisedAccountStakeAccount)
        memoisedAccountStakeAccount = accountType(
            'StakeAccount',
            'A stake account',
            accountDataJsonParsed('Stake', {
                meta: object('StakeMeta', {
                    authorized: object('StakeMetaAuthorized', {
                        staker: string(),
                        withdrawer: string(),
                    }),
                    lockup: object('StakeMetaLockup', {
                        custodian: string(),
                        epoch: bigint(),
                        unixTimestamp: bigint(),
                    }),
                    rentExemptReserve: string(),
                }),
                stake: object('StakeStake', {
                    creditsObserved: bigint(),
                    delegation: object('StakeStakeDelegation', {
                        activationEpoch: bigint(),
                        deactivationEpoch: bigint(),
                        stake: string(),
                        voter: string(),
                        warmupCooldownRate: number(),
                    }),
                }),
            })
        );
    return memoisedAccountStakeAccount;
};

let memoisedAccountVoteAccount: GraphQLObjectType | undefined;
const accountVoteAccount = () => {
    if (!memoisedAccountVoteAccount)
        memoisedAccountVoteAccount = accountType(
            'VoteAccount',
            'A vote account',
            accountDataJsonParsed('Vote', {
                authorizedVoters: list(
                    object('VoteAuthorizedVoter', {
                        authorizedVoter: string(),
                        epoch: bigint(),
                    })
                ),
                authorizedWithdrawer: string(),
                commission: number(),
                epochCredits: list(
                    object('VoteEpochCredits', {
                        credits: string(),
                        epoch: bigint(),
                        previousCredits: string(),
                    })
                ),
                lastTimestamp: object('VoteLastTimestamp', {
                    slot: bigint(),
                    timestamp: bigint(),
                }),
                nodePubkey: string(),
                priorVoters: list(string()),
                rootSlot: bigint(),
                votes: list(
                    object('VoteVote', {
                        confirmationCount: number(),
                        slot: bigint(),
                    })
                ),
            })
        );
    return memoisedAccountVoteAccount;
};

let memoisedAccountTypes: GraphQLObjectType[] | undefined;
export const accountTypes = () => {
    if (!memoisedAccountTypes)
        memoisedAccountTypes = [
            accountBase58(),
            accountBase64(),
            accountBase64Zstd(),
            accountNonceAccount(),
            accountLookupTable(),
            accountMint(),
            accountTokenAccount(),
            accountStakeAccount(),
            accountVoteAccount(),
        ];
    return memoisedAccountTypes;
};
