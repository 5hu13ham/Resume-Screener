export type ParsedResume = {
  text: string;
  pageCount?: number;
};

export interface ResumeParser {
  supports(mimeType: string, filename: string): boolean;
  parse(buffer: Buffer, filename: string): Promise<ParsedResume>;
}
