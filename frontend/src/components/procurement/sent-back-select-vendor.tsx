import { ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useFrappeGetDocList, useFrappeUpdateDoc } from "frappe-react-sdk";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react"
import { MainLayout } from '../layout/main-layout';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export const SentBackSelectVendor = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const { data: procurement_request_list, isLoading: procurement_request_list_loading, error: procurement_request_list_error } = useFrappeGetDocList("Procurement Requests",
        {
            fields: ['name', 'category_list', 'workflow_state', 'owner', 'project', 'work_package', 'procurement_list', 'creation']
        });
    const { data: vendor_list, isLoading: vendor_list_loading, error: vendor_list_error } = useFrappeGetDocList("Vendors",
        {
            fields: ['name', 'vendor_name', 'vendor_address']
        });
    const { data: quotation_request_list, isLoading: quotation_request_list_loading, error: quotation_request_list_error } = useFrappeGetDocList("Quotation Requests",
        {
            fields: ['name', 'lead_time', 'project', 'item', 'category', 'vendor', 'procurement_task', 'quote'],
            limit: 500
        });
    const { data: sent_back_list, isLoading: sent_back_list_loading, error: sent_back_list_error } = useFrappeGetDocList("Sent Back Category",
        {
            fields: ['owner','name','workflow_state','procurement_request','category','project_name','vendor','creation','item_list'],
            filters:[["workflow_state","=","Pending"]]
        });
    const { updateDoc: updateDoc, loading: loading, isCompleted: submit_complete, error: submit_error } = useFrappeUpdateDoc()

    const [page, setPage] = useState<string>('updatequotation')
    const [orderData, setOrderData] = useState({
        project_name: '',
        category: ''
    })
    if (!orderData.project_name) {
        sent_back_list?.map(item => {
            if (item.name === id) {
                setOrderData(item)
            }
        })
    }
    const [selectedVendors, setSelectedVendors] = useState({})
    const [selectedCategories, setSelectedCategories] = useState({})
    const [totals, setTotals] = useState()
    const curCategory = orderData.category

    useEffect(() => {
        const updatedCategories = { ...selectedCategories };
            const newVendorsSet = new Set();
            quotation_request_list?.forEach((item) => {
                if (item.category === curCategory && item.procurement_task === orderData.procurement_request) {
                    if (!Array.isArray(updatedCategories[curCategory])) {
                        updatedCategories[curCategory] = [];
                    }
                    newVendorsSet.add(item.vendor);
                }
            });
            const newVendors = Array.from(newVendorsSet);
            updatedCategories[curCategory] = newVendors;

        setSelectedCategories(updatedCategories);
    }, [quotation_request_list,orderData]);

    const getVendorName = (vendorName: string) => {
        return vendor_list?.find(vendor => vendor.name === vendorName)?.vendor_name;
    }
    const handleRadioChange = (cat, vendor) => {
        setSelectedVendors(prevState => {
            if (prevState.hasOwnProperty(cat)) {
                return { ...prevState, [cat]: vendor };
            } else {
                return { ...prevState, [cat]: vendor };
            }
        });
        
    };

    const handleChangeWithParam = (cat, vendor) => {
        return () => handleRadioChange(cat, vendor);
    };

    const handleSubmit = () => {
        updateDoc('Sent Back Category', id, {
            workflow_state: "Vendor Selected",
            item_list:orderData.item_list,
            vendor:orderData.vendor
        })
            .then(() => {
                console.log("item", id)
                navigate("/")
            }).catch(() => {
                console.log("submit_error",submit_error)
            })
    }

    useEffect(() => {
        setOrderData(prevState => ({
            ...prevState,
            vendor: selectedVendors[curCategory]
        }));
    }, [selectedVendors]);

    const handleUpdateOrderData = () => {
        setPage('approvequotation')
            setOrderData(prevState => {
                const updatedItemList = prevState.item_list.list.map((item) => {
                    const newPrice = quotation_request_list.find(value => 
                        value.item === item.name && value.vendor === prevState.vendor && value.procurement_task === prevState.procurement_request
                    ).quote
                    console.log(newPrice)
                    return {
                        ...item,
                        quote: newPrice
                    };
                });
                return {
                    ...prevState,
                    item_list: {
                        ...prevState.itemlist,
                        list: updatedItemList
                    }
                };
            });
    }

    const generateVendorItemKey = (vendor: string, item: string): string => {
        return `${vendor}-${item}`;
    };
    const [priceMap, setPriceMap] = useState(new Map<string, string>());

    const getPrice = (vendor: string, item: string): string | undefined => {
        const key = generateVendorItemKey(vendor, item);
        return priceMap.get(key) ? priceMap.get(key) : "-";
    };
    console.log(priceMap)
    useEffect(() => {
        const newPriceMap = new Map<string, string>();
        quotation_request_list?.forEach((item) => {
            if(item.procurement_task === orderData?.procurement_request){const key = generateVendorItemKey(item.vendor, item.item);
            newPriceMap.set(key, item.quote);}
        });
        setPriceMap(newPriceMap);
    }, [quotation_request_list,orderData]);
    // const getLowest = (cat: string) => {
    //     let price: number = 100000000;
    //     let vendor: string = '';
    //     selectedCategories[cat]?.map((ven) => {
    //         let total: number = 0;
    //         quotation_request_list?.map((item) => {
    //             if (item.vendor === ven && item.category === cat) {
    //                 const price = getPrice(ven, cat);
    //                 total += price ? parseFloat(price) : 0;
    //             }
    //         })
    //         if (total < price) {
    //             price = total;
    //             vendor = ven;
    //         }
    //     })
    //     return { quote: price, vendor_id: vendor }
    // }
    const getPackage = (name: string) => {
        return procurement_request_list?.find(item => item.name === name)?.work_package;
    }

    const getLeadTime = (vendor: string, category: string) => {
        const item = quotation_request_list?.find(item => item.vendor === vendor && item.category === category && item.procurement_task === orderData?.procurement_request)
        return item?.lead_time;
    }
    const getSelectedVendor = (cat: string) => {
        return selectedVendors[cat] ? getVendorName(selectedVendors[cat]) : ""
    }

    const getTotal = (cat: string) => {
        let total: number = 0;
        orderData.item_list?.list.map((item) => {
            const price = getPrice(selectedVendors[cat], item.name);
            total += (price ? parseFloat(price) : 0)*item.quantity;
        })
        return total
    }
    let count: number = 0;

    return (
        <MainLayout>
            {page == 'updatequotation' &&
                <div className="flex">
                    <div className="flex-1 space-x-2 md:space-y-4 p-2 md:p-12 pt-6">
                        <div className="flex items-center space-y-2">
                            {/* <ArrowLeft /> */}
                            <h2 className="text-base pt-1 pl-2 pb-4 font-bold tracking-tight">Select Vendor</h2>
                        </div>
                        <div className="grid grid-cols-5 gap-4 border border-gray-100 rounded-lg p-4">
                            <div className="border-0 flex flex-col items-center justify-center">
                                <p className="text-left py-1 font-semibold text-sm text-gray-300">Date</p>
                                <p className="text-left font-bold py-1 font-bold text-base text-black">{orderData?.creation?.split(" ")[0]}</p>
                            </div>
                            <div className="border-0 flex flex-col items-center justify-center">
                                <p className="text-left py-1 font-semibold text-sm text-gray-300">Project</p>
                                <p className="text-left font-bold py-1 font-bold text-base text-black">{orderData?.project_name}</p>
                            </div>
                            <div className="border-0 flex flex-col items-center justify-center">
                                <p className="text-left py-1 font-semibold text-sm text-gray-300">Package</p>
                                <p className="text-left font-bold py-1 font-bold text-base text-black">{getPackage(orderData?.procurement_request)}</p>
                            </div>
                            <div className="border-0 flex flex-col items-center justify-center">
                                <p className="text-left py-1 font-semibold text-sm text-gray-300">Project Lead</p>
                                <p className="text-left font-bold py-1 font-bold text-base text-black">{orderData?.owner}</p>
                            </div>
                            <div className="border-0 flex flex-col items-center justify-center">
                                <p className="text-left py-1 font-semibold text-sm text-gray-300">PR Number</p>
                                <p className="text-left font-bold py-1 font-bold text-base text-black">{orderData?.procurement_request?.slice(-4)}</p>
                            </div>
                        </div>
                        <div>
                                <Card className="flex w-full shadow-none border border-grey-500" >
                                    <CardHeader className="w-full">
                                        <div className='flex justify-between py-5'>
                                            <CardTitle className="font-bold text-xl">
                                                {curCategory}
                                            </CardTitle>
                                            <CardTitle className="font-bold text-xl">
                                                {getSelectedVendor(curCategory)}
                                            </CardTitle>
                                        </div>
                                        <div className="flex">
                                            <div className='flex-1'>
                                                <div className="bg-gray-200 p-2 font-semibold">Items<div className='py-2 font-light text-sm text-gray-400'>Delivery Time:</div></div>
                                                {orderData.item_list?.list.map((value) => {
                                                    return <div className="py-2 text-sm px-2 font-semibold border-b">
                                                        {value.item}
                                                    </div>
                                                })}
                                                <div className="py-4 text-sm px-2 font-semibold">
                                                    Total
                                                </div>
                                            </div>
                                            {selectedCategories[curCategory]?.map((item) => {
                                                let total: number = 0;
                                                const isSelected = selectedVendors[curCategory] === item;
                                                const dynamicClass = `flex-1 ${isSelected ? 'text-red-500' : ''}`
                                                return <div className={dynamicClass}>
                                                    <div className="truncate bg-gray-200 font-semibold p-2"><input className="mr-2" type="radio" id={item} name={curCategory} value={item} onChange={handleChangeWithParam(curCategory, item)} />{getVendorName(item)}
                                                        <div className='py-2 font-light text-sm text-opacity-20'>{getLeadTime(item, curCategory)} Days</div>
                                                    </div>
                                                    {orderData.item_list?.list.map((value) => {
                                                        const price = getPrice(item, value.name);
                                                        total += (price ? parseFloat(price) : 0)*value.quantity;
                                                        return <div className="py-2 text-sm px-2 text-opacity-10 border-b">
                                                            {price*value.quantity}
                                                        </div>
                                                        
                                                    })}
                                                    <div className="py-4 font-semibold text-sm px-2">
                                                        {total}
                                                    </div>
                                                </div>
                                            })}
                                        </div>
                                    </CardHeader>
                                </Card>
                            </div>
                        <div className="flex flex-col justify-end items-end fixed bottom-4 right-4">
                            <button className="bg-red-500 text-white font-normal py-2 px-6 rounded-lg" onClick={() => handleUpdateOrderData()}>
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>}
            {page == 'approvequotation' &&
                <div className="flex">
                    <div className="flex-1 space-x-2 md:space-y-4 p-2 md:p-12 pt-6">
                        <div className="flex items-center space-y-2">
                            <ArrowLeft onClick={() => setPage('updatequotation')} />
                            <h2 className="text-base pt-1 pl-2 pb-4 font-bold tracking-tight">Comparison</h2>
                        </div>
                        <div className="grid grid-cols-5 gap-4 border border-gray-100 rounded-lg p-4">
                            <div className="border-0 flex flex-col items-center justify-center">
                                <p className="text-left py-1 font-semibold text-sm text-gray-300">Date</p>
                                <p className="text-left font-bold py-1 font-bold text-base text-black">{orderData?.creation?.split(" ")[0]}</p>
                            </div>
                            <div className="border-0 flex flex-col items-center justify-center">
                                <p className="text-left py-1 font-semibold text-sm text-gray-300">Project</p>
                                <p className="text-left font-bold py-1 font-bold text-base text-black">{orderData?.project_name}</p>
                            </div>
                            <div className="border-0 flex flex-col items-center justify-center">
                                <p className="text-left py-1 font-semibold text-sm text-gray-300">Package</p>
                                <p className="text-left font-bold py-1 font-bold text-base text-black">{getPackage(orderData?.procurement_request)}</p>
                            </div>
                            <div className="border-0 flex flex-col items-center justify-center">
                                <p className="text-left py-1 font-semibold text-sm text-gray-300">Project Lead</p>
                                <p className="text-left font-bold py-1 font-bold text-base text-black">{orderData?.owner}</p>
                            </div>
                            <div className="border-0 flex flex-col items-center justify-center">
                                <p className="text-left py-1 font-semibold text-sm text-gray-300">PR Number</p>
                                <p className="text-left font-bold py-1 font-bold text-base text-black">{orderData?.procurement_request?.slice(-4)}</p>
                            </div>
                        </div>
                        <div className="w-full">
                                <div className="font-bold text-xl py-2">{curCategory}</div>
                                <Card className="flex w-1/2 shadow-none border border-grey-500" >
                                    <CardHeader className="w-full">
                                        <CardTitle>
                                            <div className="text-sm text-gray-400">Selected Vendor</div>
                                            <div className="flex justify-between border-b">
                                                <div className="font-bold text-lg py-2 border-gray-200">{getVendorName(selectedVendors[curCategory])}</div>
                                                <div className="font-bold text-2xl text-red-500 py-2 border-gray-200">{getTotal(curCategory)}</div>
                                            </div>
                                        </CardTitle>
                                        {orderData.item_list?.list.map((item) => {
                                            if(count === 2 ) {return }
                                            count++;
                                            const price = getPrice(selectedVendors[curCategory], item.name);
                                                return <div className="flex justify-between py-2">
                                                    <div className="text-sm">{item.item}</div>
                                                    <div className="text-sm">{price*item.quantity}</div>
                                                </div>
                                        })}
                                        <div className="flex justify-between py-2">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                <div className="text-sm text-blue-500 cursor-pointer">View All</div>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-[425px]">
                                                    <DialogHeader>
                                                        <DialogTitle>Items List</DialogTitle>
                                                        <DialogDescription>
                                                        <div className="grid grid-cols-6 font-medium text-black justify-between py-2">
                                                            <div className="text-sm col-span-2">Items</div>
                                                            <div className="text-sm">Qty</div>
                                                            <div className="text-sm">Unit</div>
                                                            <div className="text-sm">Rate</div>
                                                            <div className="text-sm">Amount</div>
                                                        </div>
                                                        {orderData.item_list?.list.map((item) => {
                                                            const price = getPrice(selectedVendors[curCategory], item.name);
                                                                return <div className="grid grid-cols-6 py-2">
                                                                    <div className="text-sm col-span-2">{item.item}</div>
                                                                    <div className="text-sm">{item.quantity}</div>
                                                                    <div className="text-sm">{item.unit}</div>
                                                                    <div className="text-sm">{price}</div>
                                                                    <div className="text-sm">{price*item.quantity}</div>
                                                                </div>
                                                        })}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                </DialogContent>
                                            </Dialog>      
                                            <div className="text-sm text-gray-400">Delivery Time: {getLeadTime(selectedVendors[curCategory], curCategory)} Days</div>
                                        </div>
                                    </CardHeader>
                                </Card>
                            </div>
                        <div className="flex flex-col justify-end items-end fixed bottom-4 right-4">
                            <Dialog>
                                <DialogTrigger asChild>
                                <button className="bg-red-500 text-white font-normal py-2 px-6 rounded-lg">
                                    Send for Approval
                                </button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Are you Sure</DialogTitle>
                                        <DialogDescription>
                                            Click on Confirm to Approve.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Button variant="secondary" onClick={() => handleSubmit()}>Confirm</Button>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>}
        </MainLayout>
    )
}