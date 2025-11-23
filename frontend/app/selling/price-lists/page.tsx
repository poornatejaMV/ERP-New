'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api-client';
import { fetchItems, Item } from '@/lib/api';

export interface PriceList {
    id: number;
    price_list_name: string;
    enabled: boolean;
    buying: boolean;
    selling: boolean;
    currency: string;
}

export interface ItemPrice {
    id: number;
    item_code: string;
    price_list_id: number;
    price_list_rate: number;
    currency: string;
}

export default function PriceListsPage() {
    const [priceLists, setPriceLists] = useState<PriceList[]>([]);
    const [selectedPriceList, setSelectedPriceList] = useState<PriceList | null>(null);
    const [itemPrices, setItemPrices] = useState<ItemPrice[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    
    const [showPriceListModal, setShowPriceListModal] = useState(false);
    const [showItemPriceModal, setShowItemPriceModal] = useState(false);

    const [newPriceList, setNewPriceList] = useState({
        price_list_name: '',
        enabled: true,
        buying: false,
        selling: true,
        currency: 'USD'
    });

    const [newItemPrice, setNewItemPrice] = useState({
        item_code: '',
        price_list_rate: 0,
        currency: 'USD'
    });

    useEffect(() => {
        loadPriceLists();
        loadItems();
    }, []);

    useEffect(() => {
        if (selectedPriceList) {
            loadItemPrices(selectedPriceList.id);
        }
    }, [selectedPriceList]);

    const loadPriceLists = async () => {
        try {
            const data = await apiRequest<PriceList[]>('/setup/price-lists/');
            setPriceLists(data);
            if (data.length > 0 && !selectedPriceList) {
                setSelectedPriceList(data[0]);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const loadItems = async () => {
        const data = await fetchItems();
        setItems(data);
    };

    const loadItemPrices = async (priceListId: number) => {
        try {
            const data = await apiRequest<ItemPrice[]>(`/stock/item-prices/?price_list_id=${priceListId}`);
            setItemPrices(data);
        } catch (e) {
            console.error(e);
        }
    };

    const createPriceList = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiRequest('/setup/price-lists/', {
                method: 'POST',
                body: JSON.stringify(newPriceList)
            });
            setShowPriceListModal(false);
            loadPriceLists();
        } catch (e) {
            console.error(e);
            alert('Failed to create Price List');
        }
    };

    const createItemPrice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPriceList) return;
        
        try {
            await apiRequest('/stock/item-prices/', {
                method: 'POST',
                body: JSON.stringify({
                    ...newItemPrice,
                    price_list_id: selectedPriceList.id,
                    currency: selectedPriceList.currency
                })
            });
            setShowItemPriceModal(false);
            loadItemPrices(selectedPriceList.id);
            setNewItemPrice({ ...newItemPrice, item_code: '', price_list_rate: 0 });
        } catch (e) {
            console.error(e);
            alert('Failed to create Item Price');
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Price Lists</h1>
                <button onClick={() => setShowPriceListModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                    New Price List
                </button>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Sidebar for Price Lists */}
                <div className="col-span-3 bg-white shadow rounded-lg p-4 h-[80vh] overflow-y-auto">
                    <h2 className="font-bold text-lg mb-4">Lists</h2>
                    <div className="space-y-2">
                        {priceLists.map(pl => (
                            <div
                                key={pl.id}
                                onClick={() => setSelectedPriceList(pl)}
                                className={`p-3 rounded cursor-pointer transition-colors ${selectedPriceList?.id === pl.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}
                            >
                                <div className="font-medium">{pl.price_list_name}</div>
                                <div className="text-xs text-gray-500 flex gap-2">
                                    {pl.selling && <span className="bg-green-100 text-green-800 px-1 rounded">Selling</span>}
                                    {pl.buying && <span className="bg-purple-100 text-purple-800 px-1 rounded">Buying</span>}
                                    <span>{pl.currency}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content for Item Prices */}
                <div className="col-span-9 bg-white shadow rounded-lg p-6">
                    {selectedPriceList ? (
                        <>
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold">{selectedPriceList.price_list_name}</h2>
                                    <p className="text-gray-500 text-sm">Manage item prices for this list</p>
                                </div>
                                <button onClick={() => setShowItemPriceModal(true)} className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition-colors">
                                    Add Item Price
                                </button>
                            </div>

                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {itemPrices.map((ip) => (
                                        <tr key={ip.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ip.item_code}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{ip.price_list_rate.toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ip.currency}</td>
                                        </tr>
                                    ))}
                                    {itemPrices.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-4 text-center text-gray-500">No prices defined for this list.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            Select a Price List to view details
                        </div>
                    )}
                </div>
            </div>

            {/* Create Price List Modal */}
            {showPriceListModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg w-96">
                        <h2 className="text-xl font-bold mb-4">New Price List</h2>
                        <form onSubmit={createPriceList} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Price List Name"
                                className="w-full border p-2 rounded"
                                value={newPriceList.price_list_name}
                                onChange={(e) => setNewPriceList({ ...newPriceList, price_list_name: e.target.value })}
                                required
                            />
                            <select
                                className="w-full border p-2 rounded"
                                value={newPriceList.currency}
                                onChange={(e) => setNewPriceList({ ...newPriceList, currency: e.target.value })}
                            >
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="INR">INR</option>
                            </select>
                            <div className="flex space-x-4">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={newPriceList.selling}
                                        onChange={(e) => setNewPriceList({ ...newPriceList, selling: e.target.checked })}
                                    />
                                    <span>Selling</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={newPriceList.buying}
                                        onChange={(e) => setNewPriceList({ ...newPriceList, buying: e.target.checked })}
                                    />
                                    <span>Buying</span>
                                </label>
                            </div>
                            <div className="flex justify-end space-x-2 pt-4">
                                <button type="button" onClick={() => setShowPriceListModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Item Price Modal */}
            {showItemPriceModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg w-96">
                        <h2 className="text-xl font-bold mb-4">New Item Price</h2>
                        <form onSubmit={createItemPrice} className="space-y-4">
                            <select
                                className="w-full border p-2 rounded"
                                value={newItemPrice.item_code}
                                onChange={(e) => setNewItemPrice({ ...newItemPrice, item_code: e.target.value })}
                                required
                            >
                                <option value="">Select Item</option>
                                {items.map(i => <option key={i.id} value={i.item_code}>{i.item_name}</option>)}
                            </select>
                            <input
                                type="number"
                                placeholder="Rate"
                                className="w-full border p-2 rounded"
                                value={newItemPrice.price_list_rate}
                                onChange={(e) => setNewItemPrice({ ...newItemPrice, price_list_rate: Number(e.target.value) })}
                                required
                                step="0.01"
                            />
                            <div className="flex justify-end space-x-2 pt-4">
                                <button type="button" onClick={() => setShowItemPriceModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Add Price</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

