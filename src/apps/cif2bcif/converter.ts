/**
 * Copyright (c) 2017 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { CifWriter, EncodingStrategyHint } from 'molstar/lib/mol-io/writer/cif'
import { Progress, Task } from 'molstar/lib/mol-task';
import { createModelPropertiesProvider } from 'molstar/lib/servers/model/property-provider';
import { PreprocessConfig } from 'molstar/lib/servers/model/preprocess/master';
import { readStructureWrapper, resolveStructure } from 'molstar/lib/servers/model/server/structure-wrapper';
import { CifExportContext, encode_mmCIF_categories } from 'molstar/lib/mol-model/structure';
import { classifyCif } from 'molstar/lib/servers/model/preprocess/converter';
import { Category } from 'molstar/lib/mol-io/writer/cif/encoder';
import { EncodingProvider } from 'molstar/lib/mol-io/writer/cif/encoder/binary';

function showProgress(p: Progress) {
    process.stdout.write(`\r${new Array(80).join(' ')}`);
    process.stdout.write(`\r${Progress.format(p)}`);
}

const config: PreprocessConfig = {
    numProcesses: 1,
    customProperties: {
        sources: [
            'wwpdb'
        ],
        params: {
            'wwPDB': {
                chemCompBondTablePath: './data/ccb.bcif'
            }
        }
    }
};

export default function convert(path: string, asText = false, nobonds: boolean, hints?: EncodingStrategyHint[], filter?: any) {
    return Task.create<Uint8Array>('BinaryCIF', async ctx => {
        const encodingProvider: EncodingProvider = hints ? CifWriter.createEncodingProviderFromJsonConfig(hints) :
                { get: (c, f) => void 0 };
        const propertyProvider = createModelPropertiesProvider(config.customProperties);
        const input = await readStructureWrapper('entry', '_local_', path, nobonds ? void 0 : propertyProvider);

        const encoder = CifWriter.createEncoder({
            binary: !asText,
            encoderName: 'mol*/ciftools cif2bcif',
            binaryAutoClassifyEncoding: true,
            binaryEncodingPovider: encodingProvider
        });

        if (filter) {
            encoder.setFilter(Category.filterOf(filter));
        }

        const categories = await classifyCif(input.cifFrame);
        const structure = (await resolveStructure(input))!;
        const exportCtx = CifExportContext.create(structure);

        encoder.startDataBlock(input.cifFrame.header);
        for (const cat of categories) {
            encoder.writeCategory(cat);
        }

        await ctx.update('Exporting...');
        encode_mmCIF_categories(encoder, structure, { exportCtx });
        encoder.encode();
        const ret = encoder.getData() as Uint8Array;
        await ctx.update('Done.\n');
        return ret;
    }).run(showProgress, 250);
}