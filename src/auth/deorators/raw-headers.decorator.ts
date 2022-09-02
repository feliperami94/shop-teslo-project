import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IncomingMessage } from 'http';


export const RawHeaders = createParamDecorator(
    (data: string, ctx: ExecutionContext) => {
        return ctx.switchToHttp().getRequest().rawHeaders;
    }
 
)