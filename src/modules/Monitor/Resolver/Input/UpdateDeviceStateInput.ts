import DeviceState, { DevicePartState, ContainerState } from '#/Monitor/Domain/Model/DeviceState';
import * as GraphQL from 'type-graphql';
import { InputType } from 'type-graphql';

@InputType()
export class DevicePartStateInput
    implements Partial<DevicePartState>
{

    @GraphQL.Field(() => ContainerState, { nullable: true })
    public state? : ContainerState;

    @GraphQL.Field({ nullable: true })
    public syncProgress? : number;

    @GraphQL.Field({ nullable: true })
    public temperature? : number;

}

@InputType()
export default class UpdateDeviceStateInput
    implements Partial<DeviceState>
{

    @GraphQL.Field(() => DevicePartStateInput)
    public cpu : DevicePartStateInput;

    @GraphQL.Field(() => DevicePartStateInput, { nullable: true })
    public node? : DevicePartStateInput;

    @GraphQL.Field(() => DevicePartStateInput)
    public runtime : DevicePartStateInput;

    @GraphQL.Field(() => DevicePartStateInput)
    public host : DevicePartStateInput;

}
