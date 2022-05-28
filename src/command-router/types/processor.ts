import { ResponseData } from '../router';

export type Processor = (input: string) => Promise<ResponseData>;
