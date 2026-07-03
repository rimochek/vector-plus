import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { VERIFICATION_DOCUMENT_CATEGORIES } from '../verification-document.constants';

export class PresignUploadDto {
  @IsString()
  fileName: string;

  @IsString()
  mimeType: string;

  @IsInt()
  @Min(1)
  @Max(20 * 1024 * 1024)
  size: number;

  /** @deprecated Use documentCategory */
  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  @IsString()
  @IsIn([...VERIFICATION_DOCUMENT_CATEGORIES])
  documentCategory?: string;

  @IsOptional()
  @IsString()
  examType?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedSubjectIds?: string[];

  @IsOptional()
  @IsString()
  replaceDocumentId?: string;
}

export class CompleteUploadDto {
  @IsString()
  uploadId: string;
}
