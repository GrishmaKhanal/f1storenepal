// Prices are whole rupees. Indian digit grouping matches how Nepal writes amounts.
export const rs = (n: number) => `Rs ${n.toLocaleString("en-IN")}`;

export const orderNo = (id: number) => `F1N-${1000 + id}`;
