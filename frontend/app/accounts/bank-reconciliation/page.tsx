'use client';

import { useState, useEffect } from 'react';
import { 
    fetchBankStatements, 
    fetchBankStatement,
    createBankStatement,
    getMatchingVouchers,
    createBankReconciliation,
    fetchAccounts,
    fetchCompanies,
    BankStatement,
    BankStatementTransaction,
    MatchingVoucher,
    Account,
    Company
} from '@/lib/api';

export default function BankReconciliationPage() {
    const [statements, setStatements] = useState<BankStatement[]>([]);
    const [selectedStatement, setSelectedStatement] = useState<BankStatement | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showMatchModal, setShowMatchModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<BankStatementTransaction | null>(null);
    const [matchingVouchers, setMatchingVouchers] = useState<MatchingVoucher[]>([]);
    const [loading, setLoading] = useState(false);

    const [newStatement, setNewStatement] = useState({
        bank_account_id: 0,
        company_id: 0,
        statement_date: new Date().toISOString().split('T')[0],
        csvData: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statementsData, accountsData, companiesData] = await Promise.all([
                fetchBankStatements(),
                fetchAccounts(),
                fetchCompanies()
            ]);
            setStatements(statementsData);
            setAccounts(accountsData.filter(a => a.account_type === 'Bank'));
            setCompanies(companiesData);
        } catch (e) {
            console.error('Error loading data:', e);
        }
    };

    const handleCsvUpload = (csvText: string) => {
        const lines = csvText.split('\n').filter(line => line.trim());
        const transactions: any[] = [];
        
        // Skip header if present
        const startIndex = lines[0].toLowerCase().includes('date') ? 1 : 0;
        
        for (let i = startIndex; i < lines.length; i++) {
            const parts = lines[i].split(',').map(p => p.trim());
            if (parts.length >= 3) {
                const [dateStr, desc, ref, deposit, withdrawal, balance] = parts;
                transactions.push({
                    transaction_date: dateStr,
                    description: desc || '',
                    reference_number: ref || '',
                    deposit: parseFloat(deposit || '0'),
                    withdrawal: parseFloat(withdrawal || '0'),
                    balance: balance ? parseFloat(balance) : undefined
                });
            }
        }
        
        setNewStatement({ ...newStatement, csvData: JSON.stringify(transactions) });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                handleCsvUpload(text);
            };
            reader.readAsText(file);
        }
    };

    const handleCreateStatement = async () => {
        if (!newStatement.bank_account_id || newStatement.bank_account_id === 0) {
            alert('Please select a bank account');
            return;
        }

        try {
            setLoading(true);
            let transactions: any[] = [];
            
            if (newStatement.csvData) {
                transactions = JSON.parse(newStatement.csvData);
            } else {
                // Manual entry - for now, just create empty statement
                alert('Please upload a CSV file or add transactions manually');
                return;
            }

            const statementData = {
                bank_account_id: newStatement.bank_account_id,
                company_id: newStatement.company_id || undefined,
                statement_date: newStatement.statement_date,
                transactions: transactions
            };

            await createBankStatement(statementData);
            setShowUploadModal(false);
            setNewStatement({ bank_account_id: 0, company_id: 0, statement_date: new Date().toISOString().split('T')[0], csvData: '' });
            loadData();
        } catch (e: any) {
            console.error('Error creating statement:', e);
            alert('Failed to create bank statement: ' + (e.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const handleViewStatement = async (id: number) => {
        try {
            const statement = await fetchBankStatement(id);
            setSelectedStatement(statement);
        } catch (e) {
            console.error('Error loading statement:', e);
        }
    };

    const handleMatchTransaction = async (transaction: BankStatementTransaction) => {
        if (!selectedStatement) return;
        
        try {
            setSelectedTransaction(transaction);
            const matches = await getMatchingVouchers(selectedStatement.id, transaction.id);
            setMatchingVouchers(matches);
            setShowMatchModal(true);
        } catch (e) {
            console.error('Error getting matches:', e);
        }
    };

    const handleReconcile = async (voucher: MatchingVoucher) => {
        if (!selectedStatement || !selectedTransaction) return;

        try {
            await createBankReconciliation({
                bank_statement_id: selectedStatement.id,
                transaction_id: selectedTransaction.id,
                voucher_type: voucher.voucher_type,
                voucher_id: voucher.voucher_id,
                voucher_no: voucher.voucher_no,
                matched_amount: voucher.amount
            });

            setShowMatchModal(false);
            setSelectedTransaction(null);
            setMatchingVouchers([]);
            
            // Reload statement
            if (selectedStatement) {
                await handleViewStatement(selectedStatement.id);
            }
        } catch (e: any) {
            console.error('Error reconciling:', e);
            alert('Failed to reconcile: ' + (e.message || 'Unknown error'));
        }
    };

    const getUnreconciledCount = (statement: BankStatement) => {
        return statement.transactions.filter(t => !t.is_reconciled).length;
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Bank Reconciliation</h1>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Upload Bank Statement
                </button>
            </div>

            {/* Statements List */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statement Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank Account</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transactions</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unreconciled</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {statements.map((stmt) => (
                            <tr key={stmt.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stmt.statement_date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {accounts.find(a => a.id === stmt.bank_account_id)?.account_name || `Account #${stmt.bank_account_id}`}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stmt.transactions.length}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getUnreconciledCount(stmt)}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        stmt.status === 'Reconciled' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {stmt.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <button
                                        onClick={() => handleViewStatement(stmt.id)}
                                        className="text-blue-600 hover:text-blue-900"
                                    >
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {statements.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                    No bank statements found. Upload one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Selected Statement Transactions */}
            {selectedStatement && (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">
                            Statement #{selectedStatement.id} - {selectedStatement.statement_date}
                        </h2>
                        <button
                            onClick={() => setSelectedStatement(null)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            Close
                        </button>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deposit</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Withdrawal</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {selectedStatement.transactions.map((trans) => (
                                <tr key={trans.id} className={trans.is_reconciled ? 'bg-green-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trans.transaction_date}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{trans.description || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{trans.reference_number || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                        {trans.deposit > 0 ? `$${trans.deposit.toFixed(2)}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                        {trans.withdrawal > 0 ? `$${trans.withdrawal.toFixed(2)}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {trans.is_reconciled ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Reconciled
                                            </span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                Unreconciled
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {!trans.is_reconciled && (
                                            <button
                                                onClick={() => handleMatchTransaction(trans)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                Match
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Upload Bank Statement</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account *</label>
                                <select
                                    className="w-full border p-2 rounded"
                                    value={newStatement.bank_account_id}
                                    onChange={(e) => setNewStatement({...newStatement, bank_account_id: Number(e.target.value)})}
                                    required
                                >
                                    <option value="0">Select Bank Account</option>
                                    {accounts.map(a => (
                                        <option key={a.id} value={a.id}>{a.account_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                                <select
                                    className="w-full border p-2 rounded"
                                    value={newStatement.company_id}
                                    onChange={(e) => setNewStatement({...newStatement, company_id: Number(e.target.value)})}
                                >
                                    <option value="0">Select Company</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.company_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Statement Date *</label>
                                <input
                                    type="date"
                                    className="w-full border p-2 rounded"
                                    value={newStatement.statement_date}
                                    onChange={(e) => setNewStatement({...newStatement, statement_date: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Upload CSV File</label>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    className="w-full border p-2 rounded"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    CSV format: Date, Description, Reference, Deposit, Withdrawal, Balance
                                </p>
                            </div>
                            <div className="flex justify-end space-x-2 pt-4 border-t">
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    className="px-4 py-2 text-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateStatement}
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                                >
                                    {loading ? 'Uploading...' : 'Upload Statement'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Match Modal */}
            {showMatchModal && selectedTransaction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg w-full max-w-4xl m-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Match Transaction</h2>
                        <div className="mb-4 p-4 bg-gray-50 rounded">
                            <p><strong>Date:</strong> {selectedTransaction.transaction_date}</p>
                            <p><strong>Description:</strong> {selectedTransaction.description || '-'}</p>
                            <p><strong>Reference:</strong> {selectedTransaction.reference_number || '-'}</p>
                            <p><strong>Amount:</strong> ${(selectedTransaction.deposit || selectedTransaction.withdrawal).toFixed(2)}</p>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Matching Vouchers</h3>
                        {matchingVouchers.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Voucher Type</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Voucher No</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Party</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Match Score</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {matchingVouchers.map((voucher, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-2 text-sm text-gray-900">{voucher.voucher_type}</td>
                                            <td className="px-4 py-2 text-sm text-gray-500">{voucher.voucher_no}</td>
                                            <td className="px-4 py-2 text-sm text-gray-500">{voucher.posting_date}</td>
                                            <td className="px-4 py-2 text-sm text-gray-500 text-right">${voucher.amount.toFixed(2)}</td>
                                            <td className="px-4 py-2 text-sm text-gray-500">{voucher.party || '-'}</td>
                                            <td className="px-4 py-2 text-sm text-right">
                                                <span className={`px-2 py-1 rounded text-xs ${
                                                    voucher.match_score >= 80 ? 'bg-green-100 text-green-800' :
                                                    voucher.match_score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {voucher.match_score.toFixed(0)}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-sm">
                                                <button
                                                    onClick={() => handleReconcile(voucher)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    Reconcile
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-gray-500">No matching vouchers found.</p>
                        )}
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={() => {
                                    setShowMatchModal(false);
                                    setSelectedTransaction(null);
                                    setMatchingVouchers([]);
                                }}
                                className="px-4 py-2 text-gray-600"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}





