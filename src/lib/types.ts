export interface Purchase {
    id: number;
    model: string;
    storage: string;
    condition: string;
    price: number;
    is_diff_taxed: number; // 0 or 1
    receipt_path?: string;
    created_at: string;
}
