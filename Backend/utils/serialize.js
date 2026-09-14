// The frontend (Zustand stores, React components) was written against
// Mongoose's `_id` convention. Rather than touch every `_id` reference in
// the frontend during the Postgres migration, these helpers reshape Prisma
// records (which use `id`) back into the `_id` shape at the API boundary.
const toClient = (record) => {
    if (!record || typeof record !== 'object') return record;
    const { id, userId, sourceAccountId, targetAccountId, ...rest } = record;

    const out = { _id: id, ...rest };
    if ('sourceAccount' in record) out.sourceAccountId = toClient(record.sourceAccount) || sourceAccountId;
    if ('targetAccount' in record) out.targetAccountId = toClient(record.targetAccount) || targetAccountId;
    return out;
};

const toClientList = (records) => records.map(toClient);

module.exports = { toClient, toClientList };
