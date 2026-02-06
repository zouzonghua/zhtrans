import { Translation } from '@/domain/entities/Translation';

/** 
 * 翻译服务契约 (Interface/Port)
 * 定义了翻译功能必须遵循的标准。
 */
export interface ITranslator {
  translate(text: string): Promise<Translation>;
}
