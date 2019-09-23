'use strict';

const { SUBNET_TYPES } = require('./utils/constants');
const { getSubnetLogicalIds } = require('./utils/functions');
const getRouteTemplate = require('./templates/route');

function compileRoutes() {
  const { Resources } = this.serverless.service.provider.compiledCloudFormationTemplate;
  const vpcGatewayAttachmentLogicalId = this.provider.naming.getVpcGatewayAttachmentLogicalId();

  // 1 route for each NatGateway
  const natGatewayLogicalIds = getSubnetLogicalIds
    .call(this, SUBNET_TYPES.PUBLIC)
    .map(subnetLogicalId => this.provider.naming.getNatGatewayLogicalId(subnetLogicalId));
  const natGatewayRouteResources = natGatewayLogicalIds.map(natGatewayLogicalId => {
    const logicalId = this.provider.naming.getRouteLogicalId(natGatewayLogicalId);
    const routeTableLogicalId = this.provider.naming.getRouteTableLogicalId(SUBNET_TYPES.PRIVATE);
    return {
      [logicalId]: getRouteTemplate(
        'nat',
        routeTableLogicalId,
        natGatewayLogicalId,
        vpcGatewayAttachmentLogicalId
      ),
    };
  });

  // 1 route for each InternetGateway (there's only one)
  const internetGatewayLogicalId = this.provider.naming.getInternetGatewayLogicalId();
  const logicalId = this.provider.naming.getRouteLogicalId(internetGatewayLogicalId);
  const routeTableLogicalId = this.provider.naming.getRouteTableLogicalId(SUBNET_TYPES.PUBLIC);
  const internetGatewayResource = {
    [logicalId]: getRouteTemplate(
      'internet',
      routeTableLogicalId,
      internetGatewayLogicalId,
      vpcGatewayAttachmentLogicalId
    ),
  };

  const resourcesToMerge = [...natGatewayRouteResources, internetGatewayResource];

  Object.assign(Resources, ...resourcesToMerge);
}

module.exports = { compileRoutes };