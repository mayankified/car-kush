import { Customer, Employee } from '../types';

export const getReferralChain = (customer: Customer, customers: Customer[], employees: Employee[]) => {
    const chain: { id: string; name: string; type: 'C' | 'S' }[] = [];
    let currentLink: { custId?: string; empId?: string } | undefined = undefined;

    if (customer.referredByCustomerId) currentLink = { custId: customer.referredByCustomerId };
    else if (customer.referringEmployeeId) currentLink = { empId: customer.referringEmployeeId };

    while (currentLink && chain.length < 3) {
        if (currentLink.custId) {
            const parent = customers.find(c => c.id === currentLink!.custId);
            if (parent) {
                chain.push({ id: parent.id, name: parent.name, type: 'C' });
                currentLink = parent.referredByCustomerId
                    ? { custId: parent.referredByCustomerId }
                    : parent.referringEmployeeId
                        ? { empId: parent.referringEmployeeId }
                        : undefined;
            } else break;
        } else if (currentLink.empId) {
            const staff = employees.find(e => e.id === currentLink!.empId);
            if (staff) chain.push({ id: staff.id, name: staff.name, type: 'S' });
            currentLink = undefined;
        }
    }
    return chain;
};