/**
 * Copyright (c) 2017-2019 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

import * as argparse from 'argparse'
import * as fs from 'fs'
import convert from './converter'

async function process(srcPath: string, outPath: string) {
    const res = await convert(srcPath);
    fs.writeFileSync(outPath, res);
}

function run(args: Args) {
    process(args.src, args.out)
}

const parser = new argparse.ArgumentParser({
    addHelp: true,
    description: 'Convert any CIF file to a BCIF file'
});
parser.addArgument([ 'src' ], {
    help: 'Source CIF path'
});
parser.addArgument([ 'out' ], {
    help: 'Output BCIF path'
});
interface Args {
    src: string
    out: string
}
const args: Args = parser.parseArgs();

if (args) {
    run(args)
}