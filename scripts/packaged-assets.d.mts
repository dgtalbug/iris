export declare const PACKAGE_FILES_ENTRIES: string[];
export declare const SOURCE_ASSETS: string[];
export declare const BUILD_ASSETS: string[];
export declare const PACKAGED_ASSETS: string[];
export declare function assetsMissingFromFilesField(files: string[] | undefined): string[];
export declare function assetsMissingFromPayload(packedPaths: Iterable<string>): string[];
