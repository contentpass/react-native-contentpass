#import <React/RCTLinkingManager.h>
#import "RNAppAuthAuthorizationFlowManager.h"
#import <RCTAppDelegate.h>
#import <UIKit/UIKit.h>
#import <Expo/Expo.h>

@interface AppDelegate : EXAppDelegateWrapper <RNAppAuthAuthorizationFlowManager>
@property(nonatomic, weak) id<RNAppAuthAuthorizationFlowManagerDelegate> authorizationFlowManagerDelegate;

@end
